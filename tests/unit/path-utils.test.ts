import {
    describe,
    it
} from 'node:test';
import assert from 'node:assert';
import { PathUtils } from '../../src/main-server/path-utils';

describe('path utils', () => {
    const path = '/pathname/:param1/:param2';
    const expectedRegex = new RegExp('/pathname/([^/]+)/([^/]+)')

    describe('parsePath()', () => {
        it("should extract params from the path and return a regex exp", () => {

            const paramsNames: string[] = [];

            const regex = PathUtils.parsePath(path, paramsNames);

            assert.deepStrictEqual(regex, expectedRegex);
            assert.strictEqual(paramsNames[0], "param1");
            assert.strictEqual(paramsNames[1], "param2");
        })
    })

    describe('findPath()', () => {
        const paths: string[] = [];
        paths.push(expectedRegex + "");
        it("should find path regex and return the path", () => {
            const result = PathUtils.findPath(paths,path);
            assert.strictEqual(result,expectedRegex+"");
        })

        it("should return null when the path is not found",()=> {
            const result = PathUtils.findPath(paths,'invalidPath');
            assert.strictEqual(result,null);
        })
    })

    describe('extractParamsFromUrlPath()', ()=>{
        it('should return params from a given url according to the path regex',()=>{
            const params = PathUtils.extractParamsFromUrlPath(expectedRegex+"",'/pathname/25/100');

            const expectedParams = ['25','100'];

            assert.deepStrictEqual(params,expectedParams);
        })
    })
    
    describe('extractQueryParamsFromUrl()',()=>{
        it('should return query params from a given url',()=> {
            const query = {
                page : 5,
                size : 25,
                sort : "asc"
            }
            const queryParams = PathUtils.extractQueryParamsFromUrl(query);

            assert.strictEqual(queryParams.page,5);
            assert.strictEqual(queryParams.size,25);
            assert.strictEqual(queryParams.sort,"asc");
        })
    })

    describe('isPathMatchToPattern',()=> {
        it('should return true when path matches with pattern',()=> {
            assert.strictEqual(PathUtils.isPathMatchToPattern("/pathname","/pathname/"),true);
            assert.strictEqual(PathUtils.isPathMatchToPattern("/pathname/","/pathname"),true);
            assert.strictEqual(PathUtils.isPathMatchToPattern("/pathname/*","/pathname"),true);
            assert.strictEqual(PathUtils.isPathMatchToPattern("/pathname/*","/pathname/5"),true);
            assert.strictEqual(PathUtils.isPathMatchToPattern("/pathname/*","/pathname/5?page=1&size=20"),true);
            assert.strictEqual(PathUtils.isPathMatchToPattern("/pathname/**","/pathname"),true);
            assert.strictEqual(PathUtils.isPathMatchToPattern("/pathname/**","/pathname/5"),true);
            assert.strictEqual(PathUtils.isPathMatchToPattern("/pathname/**","/pathname/5/asc?limit=25"),true);
        })

        it('should return false when path do not match with pattern',()=> {
            assert.strictEqual(PathUtils.isPathMatchToPattern("/pathname/*","/invalid"),false);
            assert.strictEqual(PathUtils.isPathMatchToPattern("/pathname","/pathname/5"),false);
            assert.strictEqual(PathUtils.isPathMatchToPattern("/pathname/*","/pathname/5/10"),false);
            assert.strictEqual(PathUtils.isPathMatchToPattern("/pathname/**","/invalid/5/10"),false);
        })
    })
})