import {Vue, Watcher} from "./Vue.js";


//======测试=======
let data={
    message:'hello',
    num:0
};

let app=new Vue({
    data:data
});

//模拟数据监听
new Watcher(app,'message',function(value){
    //模拟dom变更
    console.log('message 引起的dom变更--->',value);
});

//模拟数据监听
new Watcher(app,'num',function(value){
    //模拟dom变更
    console.log('num 引起的dom变更--->',value);
});

//开发者为callbacks添加的异步回调事件
app.$nextTick(function(){
   console.log('这是dom更新完成后的操作');
});

data.message='world'; //数据一旦更新，会为nextTick的事件队列callbacks中加入一个flushUpdateQueue回调函数
data.message='world1';
data.message='world2'; //message的变更push到updateQueue中，只保存最后一次赋值的结果
for(let i=0;i<=100;i++){
   data.num=i;//num的变更push到updateQueue中，只保存最后一次赋值的结果
}