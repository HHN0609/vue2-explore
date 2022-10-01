# How to run test ?

> npm run start

# Origin thesis

> [一拳不是超人-学透Vue源码~nextTick原理](https://juejin.cn/post/6930413268376748045)  
> 在自己的理解上添加了更多详细的注释，原文写的很好，值得一读!

# Watcher？Observer？Dep？

1. `Watcher`和`Observer`是不一样的（虽然在中文上看意思差不多），在**模板渲染**的时候，会把`依赖`（*{{}}语法*、*compute*、*watch*等对`vue实例的data`有依赖的部分）转换成`Watcher`实例，并注册回调函数，这个回调函数就是用来修改视图的。
   
   在实例化`Watcher`的时候，会传入3个参数：`vue实例`、`属性` 、`回调函数`，在实例化的，每个`watcher`实例中会保存一份属性值的副本，`update` 的时候会将新旧值进行比对。
   
   `Watcher` 实例会有一个`update` 方法， 每个`watcher`实例都有一个`uid`的

2. `Observer` 则是对`vue实例的data` 中的属性进行`getter/setter` 进行重写（vue2用的是`Object.defineProperty` 进行重写，vue3用的是 `Proxy` ），并给每个属性设置一个`依赖收集器deps(一个数组)`, `deps`里放的是**依赖这个属性的Watcher** 。当属性的值被**读取**时候，比如：`app.data.num`，就会触发这个属性的`getter`（这里的**读取**往往是在**Watcher** 初始化实例的时候进行读取），在**Watcher** 初始化实例的时候会把`this（Watcher实例本身）`挂载到`Dep.target`上，`getter` 触发的时候会把`Dep.target`添加到对应属性的`deps` 里面。

3. `Dep`就是一个依赖容器，一个数组存放 `Watcher` 实例，一个`addSubs`方法添加`watcher` , 一个 `notify`方法逐一触发数组中的`watcher`实例的`update`方法更新视图。
