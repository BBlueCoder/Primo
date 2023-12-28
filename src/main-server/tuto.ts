export class Tuto {

    private interceptors: Map<string, AppInterceptor[]> = new Map();

    paths(path :string) {
        if(!this.interceptors.get(path))
            this.interceptors.set(path,[]);
        return new TutoBuilder(this,this.interceptors.get(path) || [])
    }
    

    excute(path : string) {
        // const keys = this.interceptors.keys();

        // for(let k of keys){
        //     const intp = this.interceptors.get(k);
        //     intp!.forEach(i => {
        //         i.intercept();
        //     })
        // }
        console.log(this.interceptors.keys());
        
        this.excuteRecursive(path,0);
    }

    excuteRecursive(path : string, index : number) {
        const intps = this.interceptors.get(path);
        if(index<intps!.length){
            intps![index].intercept(()=>{
                this.excuteRecursive(path,index + 1);
            })
        }else{
            console.log("done!");
        }
    }
}

class TutoBuilder {
    constructor(private tuto : Tuto,private interceptors : AppInterceptor[]){}

    addInterceptor(interceptor : AppInterceptor){
        this.interceptors.push(interceptor);
        return this.tuto;
    }
}

export interface AppInterceptor{
    intercept(next : Function) : void
}

