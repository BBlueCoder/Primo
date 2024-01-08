
export class PathUtils {

    public static parsePath(path: string, paramNames: string[]): RegExp {

        const regexPath = path.replace(/:(\w+)/g, (_, paramName) => {
            paramNames.push(paramName);
            return '([^/]+)';
        })

        return new RegExp(`${regexPath}`);
    }

    private static wrapPath(pathname: string): string {
        if (pathname[pathname.length - 1] !== '/')
            return "/" + pathname + '/';

        return "/" + pathname;
    }

    public static findPath(paths : string[], path: string): string | null {
        const parsedPath = PathUtils.wrapPath(path);

        let result: string | null = null;

        paths.forEach(p => {
            const regex = new RegExp(`^${p}$`);

            if (regex.test(parsedPath)) {
                result = p;
            }
        })

        return result;
    }

    public static extractParamsFromUrlPath(pathRegex: string, url: string): string[] {
        const extractedResult = new RegExp(pathRegex).exec(PathUtils.wrapPath(url));
        const params: string[] = [];

        if (extractedResult !== null) {
            let i = 1;
            while (typeof extractedResult[i] === 'string') {
                params.push(extractedResult[i]);
                i++;
            }
        }

        return params;
    }

    public static extractQueryParamsFromUrl(query: object): { [name: string]: string } {
        const queryParams: { [name: string]: string } = {};

        const keys = Object.keys(query);
        const values: string[] = Object.values(query);

        let i = 0;
        keys.forEach(key => {
            queryParams[key] = values[i];
            i++;
        });

        return queryParams;
    }

    public static isPathMatchToPattern(pattern : string, path : string) : boolean {
        const patternArrays = pattern.split('/').filter(e => e);
        const pathArrays = path.split('/').filter(e => e);

        const lastIndex = patternArrays.length - 1;

        if(patternArrays[lastIndex] == "*"){
            for(let i = 0; i < pathArrays.length ; i++){
                if(i>=patternArrays.length)
                    return false;
                if(patternArrays[i] != "*" && patternArrays[i] != pathArrays[i])
                    return false;
            }
        }else if(patternArrays[lastIndex] == "**"){
            for(let i = 0; i< pathArrays.length ; i++){
                if(patternArrays[i] == "**")
                    break;

                if(patternArrays[i] != pathArrays[i])
                    return false;
            }
        }else {
            if(pathArrays.length != patternArrays.length)
                return false;

            for(let i = 0; i<patternArrays.length;i++){
                if(patternArrays[i] != pathArrays[i])
                    return false;
            }
        }

        return true;
    }

    public static getPatternThatMatchesPath(patterns : IterableIterator<string> , path : string) : string {
        for(let p of patterns){
            if(this.isPathMatchToPattern(p,path))
                return p;
        }

        return "";
    }

}