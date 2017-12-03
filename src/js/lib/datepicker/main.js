/**
 * 
 * @authors yutent (yutent@doui.cc)
 * @date    2016-02-14 13:58:39
 *
 */
"use strict";

define([
    'text!./main.htm',
    'css!./style.css',
], function(tpl){

    yua.ui.datepicker = '1.0.0'
    yua.component('datepicker', {
        $template: tpl,
        $construct: function(sys, option, attr){
            
            // 先合并config的配置及元素的属性
            var opts = Object.assign({}, option, attr),
                defVal;

            if(!opts.value){
                return yua.error('日历组件必须设置value属性')
            }

            //获取初始值
            defVal = sys.$up[opts.value]

            //日期格式化, 默认会调用过滤器的格式'Y-m-d H:i:s'
            if(!opts.showTime && !opts.format){
                opts.format = 'Y-m-d';
            }

            // 修正默认值, 如果不是Date对象, 则转为Date对象
            if(!defVal){
                if(opts.minDate){
                    defVal = opts.minDate;
                }else if(opts.maxDate){
                    defVal = opts.maxDate;
                }else{
                    defVal = new Date()
                }
            }
            if(!Date.isDate(defVal)){
                defVal = new Date(defVal)
            }
            
            opts.update_value = opts.value
            opts.value = defVal.format(opts.format)

            opts.calendar = {
                list: [1],
                year: defVal.format('Y'),
                month: defVal.format('m'),
                day: defVal.format('d'),
                hour: defVal.format('H'),
                minute: defVal.format('i'),
                second: defVal.format('s'),
                minYear: 0,
                minMonth: 0,
                minDay: 0,
                maxYear: 0,
                maxMonth: 0,
                maxDay: 0
            }

            if(opts.minDate){
                if(!Date.isDate(opts.minDate)){
                    opts.minDate = new Date(opts.minDate)
                }
                opts.calendar.minYear = opts.minDate.format('Y')
                opts.calendar.minMonth = opts.minDate.format('m')
                opts.calendar.minDay = opts.minDate.format('d')
            }

            if(opts.maxDate){
                if(!Date.isDate(opts.maxDate)){
                    opts.maxDate = new Date(opts.maxDate)
                }
                opts.calendar.maxYear = opts.maxDate.format('Y')
                opts.calendar.maxMonth = opts.maxDate.format('m')
                opts.calendar.maxDay = opts.maxDate.format('d')
            }

            //移除部分属性
            delete opts.minDate;
            delete opts.maxDate;
            return yua.mix(sys, opts)
        },
        $ready: function(vm, ele){
            var last = {
                    year: +vm.calendar.year,
                    month: +vm.calendar.month,
                    day: +vm.calendar.day
                },
                timer;

            getCalendar(vm, last) //初始化日历显示

            //日历按钮,未超出限制时切换日历
            vm.$turn = function(type, step){
                var year = +vm.calendar.year,
                    month = +vm.calendar.month;

                if(type === 1){
                    year += step;
                }else{
                    month += step;
                    if(month < 1){
                        month = 12;
                        year--
                    }
                    if(month > 12){
                        month = 1;
                        year++
                    }
                }
                if(isLimited(vm.calendar, year, month) === true){
                    vm.tips = '日期超出限制';
                    return;
                }
                vm.calendar.year = year;
                vm.calendar.month = numberFormat(month, 2);
            }

            //选择日期
            vm.$getDate = function(disabled, day){
                if(disabled)
                    return;

                vm.calendar.day = day;

                changeStyle(vm.calendar, day);
                updateTime(vm, last);
                vm.showCalendar = !1;
            }

            //输入框获取焦点时，显示日历
            vm.$focus = function(){
                vm.showCalendar = !0;
            }

            //获取当前时间
            vm.$now = function(){
                var now = new Date(),
                    year = now.format('Y'),
                    month = now.format('m'),
                    day = now.format('d');

                var isLimitYM = isLimited(year, month),
                    disabled = disabledDay(day, isLimitYM);

                if(disabled){
                    vm.tips = '今天超出了限制日期';
                    return;
                }

                vm.calendar.year = year;
                vm.calendar.month = month;
                vm.calendar.day = day;
                vm.calendar.hour = now.format('H');
                vm.calendar.minute = now.format('i');
                vm.calendar.second = now.format('s');

                changeStyle(vm.calendar, day);
                updateTime(vm, last);

                vm.showCalendar = !1;
            }
            

            /************************************************************/

            vm.$watch('calendar.year', function(){
                getCalendar(vm, last);
            })

            vm.$watch('calendar.month', function(){
                getCalendar(vm, last);
            })
            vm.$watch('calendar.hour', function(v){
                vm.calendar.hour = v
                updateTime(vm, last)
            })
            vm.$watch('calendar.minute', function(v){
                vm.calendar.minute = v
                updateTime(vm, last)
            })
            vm.$watch('calendar.second', function(v){
                vm.calendar.second = v
                updateTime(vm, last)
            })

            vm.$watch('showCalendar', function(v){
                if(v || !vm.value)
                    return;
                
                vm.$up[vm.update_value] = vm.value
                vm.$onUpdate(vm.value);
            })

            vm.$watch('tips', function(v){
                if(!v)
                    return;
                clearTimeout(timer);
                timer = setTimeout(function(){
                    vm.tips = '';
                }, 1500)
            })

            document.addEventListener('click', function(){
                vm.showCalendar = !1;
            })

        },
        showTime: false, //对话框上显示时间
        showCalendar: false, //显示日历对话框
        disabled: false, //是否禁用
        tips: '',
        format: '', // 日期显示格式
        value: '', // 用于显示在输入框里的日期变量
        $prevYear: '<<',
        $nextYear: '>>',
        $prevMonth: '<',
        $nextMonth: '>',
        $focus: yua.noop,
        $turn: yua.noop,
        $getDate: yua.noop,
        $now: yua.noop,
        $cancelBubble: function(event){
            event.stopPropagation && event.stopPropagation() || (event.cancelBubble = true);
        },
        $onUpdate: yua.noop, //日期被修改后的回调
    })

/**************** 公共函数 *****************/
    //计算日历数组
    function getCalendar(vm, last){
        var year = +vm.calendar.year,
            month = +vm.calendar.month,
            nums = getTotalDays(year, month),
            numsFixed = -getFirstDay(year, month) + 1,
            isLimitYM = isLimited(vm.calendar, year, month);

        vm.calendar.list.clear();

        for(var i = numsFixed; i <= nums; i++){

            var day = {
                weeken: !1,
                day: '',
                selected: !1,
                disable: !0
            }
            if(i > 0){
                var d = getFirstDay(year, month, i)
                day = {
                    weeken: d == 0 || d == 6,
                    day: i,
                    selected: isSelected(vm.calendar, last, i),
                    disable: disabledDay(vm.calendar, i, isLimitYM)
                }
            }
            vm.calendar.list.push(day)
        }
    }

    //判断当前年/月是否超出限制
    function isLimited(calendar, year, month){
        var limit = {
                Y: +calendar.minYear,
                M: +calendar.minMonth,
                mY: +calendar.maxYear,
                mM: +calendar.maxMonth,
            },
            res = '';

        if((!limit.Y && !limit.mY) || (!limit.M && !limit.mM) || !year){
            return false
        }

        
        if((limit.Y && year < limit.Y) || (limit.mY && year > limit.mY)){
            return true
        }

        if(month){
            if(year === limit.Y){
                if(limit.M && month < limit.M)
                    return true

                if(month == limit.M)
                    res += '-'
            }

            if(year === limit.mY){
                if(limit.mM && month > limit.mM)
                    return true

                if(month == limit.mM)
                    res += '+'
            }
        }
        return res
    }

    //判断指定天数是否有效
    function disabledDay(calendar, day, limitedYM){
        var minD = calendar.minDay,
            maxD = calendar.maxDay;

        if(limitedYM === '-')
            return day < minD

        if(limitedYM === '+')
            return maxD && day > maxD

        if(limitedYM === '-+')
            return day < minD || (maxD && day > maxD)

        return limitedYM
    }

    //判断指定天数是否被选中
    function isSelected(calendar, last, day){
        var year = +calendar.year,
            month = +calendar.month;

        return !(last.year !== year  || last.month !== month || last.day !== day)
    }

    //修改当前选中日期的样式
    function changeStyle(calendar, day){
        calendar.list.forEach(function(item){
            if(item.day != day){
                item.selected = !1
            }else{
                item.selected = !0
            }
        })
    }

    //更新时间
    function updateTime(vm, last){
        var hour = 0,
            minute = 0,
            second = 0;

        last = {
            year: +vm.calendar.year,
            month: +vm.calendar.month,
            day: +vm.calendar.day
        }

        if(vm.showTime){
            hour = vm.calendar.hour
            minute = vm.calendar.minute
            second = vm.calendar.second
        }
        vm.value = new Date(last.year, last.month - 1, last.day, hour, minute, second).format(vm.format)
    }


    //获取今年的年份/月份，返回的是数组
    function getThisYearMonth(){
        var oDate = new Date()
        return [oDate.getFullYear(), oDate.getMonth() + 1]
    }

    //根据年份获取指定月份天数
    function getTotalDays(year, month){
        return new Date(year, month, 0).getDate()
    }

    //判断指定年月第一天是星期几
    function getFirstDay(year, month, day){
        return new Date(year, month - 1, day || 1).getDay()
    }
    //数字长度补全（前面加0）
    function numberFormat(num, len){
        num += ''
        if(num.length === len)
            return num

        while(num.length < len)
            num = '0' + num
        return num
    }

    return yua
})