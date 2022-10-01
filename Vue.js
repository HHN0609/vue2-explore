// 全局变量
const updateQueue = []; //异步更新队列，存放的是watcher实例
let has = {}; //控制变更队列中不保存重复的Watcher
const callbacks = [];
let pending = false;

class Dep {
    static target = null
    constructor() {
        this.subs = [];
    }
    addSubs(watcher) {
        this.subs.push(watcher);
    }
    notify() {
        for (let i = 0; i < this.subs.length; i++) {
            this.subs[i].update();
        }
    }
}

class Observer {
    /**
     * 对data对象进行观察
     * @param {object} data 要观察的对象 
     */
    constructor(data) {
        if (typeof data == 'object') {
            this.walk(data);
        }
    }

    /**
     * 遍历对象
     * @param {object} obj 需要遍历的对象
     */
    walk(obj) {
        const keys = Object.keys(obj);
        for (let i = 0; i < keys.length; i++) {
            this.defineReactive(obj, keys[i]);
        }
    }

    /**
     * 把对象的属性进行setter/getter重写
     * @param {object} obj 观测的对象
     * @param {string} key 观测对象的对象
     */
    defineReactive(obj, key) {
        if (typeof obj[key] == 'object') {
            this.walk(obj[key]);
        }
        const dep = new Dep();
        // 局部全局变量(闭包)
        let val = obj[key];
        Object.defineProperty(obj, key, {
            enumerable: true,
            configurable: true,

            //get代理将Dep.target即Watcher对象添加到依赖集合中
            get() {
                if (Dep.target) {
                    dep.addSubs(Dep.target);
                }
                return val;
            },
            set(newVal) {
                // 这两句代码不能换位置!!!
                val = newVal;
                dep.notify();
            }
        });
    }
}

let uid = 0;
export class Watcher {
    /**
     * 构建对vm某个属性的watcher实例，同时把这个watcher实例暂时存放到Dep.target中
     * 触发第一次getter，将自身添加到对应属性的依赖收集器里
     * @param {Vue} vm Vue实例
     * @param {string} key 与watcher相关的对象的key
     * @param {Function} cb 对应key的值发生变化时候触发的callback(更新视图)
     */
    constructor(vm, key, cb) {
        this.vm = vm;
        this.key = key;
        this.cb = cb;
        this.uid = uid++;

        //触发getter，添加依赖
        Dep.target = this;
        // watcher实例也有一个value属性
        // 这个实例有两个作用
        // 1.初始化watcher实例的时候，读取Vue实例vm的$data对象中的某个key的值，触发getter，收集依赖
        // 2.在watcher的update方法中，this.value相当于是一个previous value, 可用于vm.$data中的对应的值，进行比对
        this.value = vm.$data[key];
        Dep.target = null;
    }

    update() {
        // 新旧值进行比较
        if (this.value !== this.vm.$data[this.key]) {
            // 更新旧的值
            this.value = this.vm.$data[this.key];

            //不是立即执行run方法，而是把watcher实例放入updateQueue队列中
            // 这里的uid是watcher的唯一标识符
            // 在一次事件循环中，某个key的value发生了变化，对应的watcher只会被添加一次！
            if (!has[this.uid]) {
                has[this.uid] = true;
                updateQueue.push(this);
            }
            
            //控制变量，控制每次事件循环期间只 添加一次 flushUpdateQueue 到callbacks
            // 注意这里不是把watcher添加到callbacks里，而是flushUpdateQueue（一个watcher数组）
            if (this.vm.waiting === false) {
                this.vm.$nextTick(this.vm.flushUpdateQueue);
                this.vm.waiting = true;
            }

        }
    }

    run() {
        // 在一个事件循环内watcher实例的value属性永远是最新的值
        // 在后续统一更新的时候（cb执行的时候）拿到的也是最新的值
        this.cb(this.value);
    }
}

export class Vue {
    constructor(options) {
        this.waiting = false
        this.$el = options.el;
        this._data = options.data;
        this.$data = this._data;
        this.$nextTick = this.nextTick;
        new Observer(this._data);
    }

    //简易版nextTick
    nextTick(cb) {
        callbacks.push(cb);
        //控制变量，控制每次事件循环期间只执行一次flushCallbacks
        if (!pending) {
            pending = true;
            if(Promise){
                Promise.resolve().then(() => {
                    this.flushCallbacks();
                });
            } else {
                setTimeout(() => {
                    //会在同步代码（上一次宏任务）执行完成后执行
                    this.flushCallbacks();
                });
            }
        }
    }

    /**
     * 清空UpdateQueue队列，更新视图
     * flushUpdateQueue会在flushCallbacks被调用
     * @param {Vue} vm Vue实例
     */
    flushUpdateQueue(vm) {
        while (updateQueue.length != 0) {
            updateQueue.shift().run();
        }
        has = {};
        vm.waiting = false;
    }

    /**
     * 清空callbacks 
     */
    flushCallbacks() {
        while (callbacks.length != 0) {
            //传入当前vm实例，使得flushUpdateQueue能获取到
            // 当然nextTick添加的callback不需要这个this，传了这个参数也没事
            callbacks.shift()(this);
        }
        pending = false;
    }
}