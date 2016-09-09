import buble from 'rollup-plugin-buble';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import uglify from 'rollup-plugin-uglify';

export default {
	entry: 'index.js',
	plugins: [
		nodeResolve({
			main: true
		}),
		commonjs({
			include: 'node_modules/**'
		}),
		buble(),
		uglify(),
	],
	targets: [
		{
			dest: 'dist/simple-dirty-check.js',
			format: 'umd',
			moduleName: 'SDC',
			// sourceMap: true
		}
	]
};
