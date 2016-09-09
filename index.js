import deepClone from 'clone';
import deepEqual from 'deep-equal';
import { get, set } from 'dot-prop';

const MAX_DIGEST_TIMES = 20;

class SDC {
	static create( ...args ) {
		return new this( ...args );
	}
	constructor( data ) {
		this.data = data;
		this._watchers = {};
	}
	get( keypath ) {
		return get( this.data, keypath );
	}
	compute( key, deps, fn, deep ) {
		// 先计算一次
		this.data[ key ] = fn();
		
		for( let i = 0, len = deps.length; i < len; i++ ) {
			let dep = deps[ i ];
			this.watch( dep, () => {
				this.data[ key ] = fn();
			}, deep );
		}
	}
	unwatch() {
		// TODO
	}
	watch( keypath, fn, deep ) {
		// 取当前keypath对应的值作为快照，用于后续比较，如果deep === true，则deepClone一份，避免因为保持引用被修改
		const watchers = this._watchers;
		watchers[ keypath ] = watchers[ keypath ] || [];

		let v;
		if( !deep ) {
			v = this.get( keypath );
		} else {
			v = deepClone( this.get( keypath ) );
		}
		
		watchers[ keypath ].push({
			keypath: keypath,
			last: v,
			deep: !!deep,
			watcher: fn,
		});
	}
	digest() {
		let dirty;
		let ttl = MAX_DIGEST_TIMES;
		
		const digestOne = () => {
			console.debug( '> digestOne' );
			dirty = false;
			const watchers = this._watchers;
			for( let kp in watchers ) {
				let watcher = watchers[ kp ];
				for( let i = 0, len = watcher.length; i < len; i++ ) {
					const w = watcher[ i ];
					const newValue = this.get( w.keypath );
					const oldValue = w.last;

					// 由w.deep决定基于引用比较还是值比较
					let isEqual = true;
					if( !w.deep ) {
						isEqual = newValue === oldValue;
					} else {
						isEqual = deepEqual( newValue, oldValue );
					}

					// 不相等，则重新赋值last，执行对应的watcher
					if( !isEqual ) {
						w.last = w.deep ? deepClone( newValue ) : newValue
						w.watcher( newValue, oldValue );
						dirty = true;
					}
				}
			}

			ttl--;

			if( ttl < 0 ) {
				throw new Error( '数据震荡' );
				return;
			}

			// 进入下一轮digest
			if( dirty ) {
				digestOne();
			}
		};

		digestOne();
	}
}

export default SDC;