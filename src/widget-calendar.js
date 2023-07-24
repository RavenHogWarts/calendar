/*
*   万年历组件
*/
import {holidayMap,scheduleMap} from './module/data/holiday';
import {getDateString} from './module/tool';
import {getSolarMonthDays} from './module/solar';
import {sFestival,lFestival,oFestival,tFestival} from './module/festival';
import calendar from './calendar';

class WidgetCalendar extends HTMLElement {
    constructor() {
        super();

        // 全局变量
        let _ = this;
        _.today = calendar.getToday();
        let today_date = getDateString(_.today['sYear'],_.today['sMonth'],_.today['sDay']);
        _.date = _.getAttribute('date')||today_date;    // 选中日期
        _.currentDateInfo = _.today;
        _.currentMonthData = [];    // 当前日期所在月份数据
        _.currentMonthDay = 1;     // 当前日期当月几号
    }
    connectedCallback () {
        let _ = this;
        // 模板
        _.attachShadow({mode:'open'});
        _.render();
        _.addStyle();
        // 节点
        _.$module = _.shadowRoot.querySelector('.mod-calendar');
        _.$tbody = _.$module.querySelector('tbody');
        _.$year = _.$module.querySelector('.year');
        _.$month = _.$module.querySelector('.month');
        _.$holiday = _.$module.querySelector('.holiday');
        _.$goback = _.$module.querySelector('.goback');
        _.$prev_year = _.$module.querySelector('.prev-year');
        _.$next_year = _.$module.querySelector('.next-year');
        _.$prev_month = _.$module.querySelector('.prev-month');
        _.$next_month = _.$module.querySelector('.next-month');
        _.$info = _.$module.querySelector('.info');

        _.$year.onchange = function(){
            let year = _.$year.value;
            let month = _.$month.value;
            _.formatTable({'year':year,'month':month,'day':_.currentMonthDay});
            _.formatSetting(year);
        };
        _.$month.onchange = function(){
            let year = _.$year.value;
            let month = _.$month.value;
            _.formatTable({'year':year,'month':month,'day':_.currentMonthDay});
        };
        _.$holiday.onchange = function(){
            let value = _.$holiday.value;
            if(value){
                let [year,month,day] = value.split('-');
                _.formatTable({'year':year,'month':month,'day':day});
            }
        };
        _.$goback.onclick = function(){
            _.formatTable();
            _.formatSetting();
        };
        _.$prev_year.onclick = function(){
            let year = _.$year.value;
            let month = _.$month.value;
            year--;
            _.formatTable({'year':year,'month':month,'day':_.currentMonthDay});
            _.formatSetting(year);
        };
        _.$next_year.onclick = function(){
            let year = _.$year.value;
            let month = _.$month.value;
            year++;
            _.formatTable({'year':year,'month':month,'day':_.currentMonthDay});
            _.formatSetting(year);
        };
        _.$prev_month.onclick = function(){
            let year = _.$year.value;
            let month = _.$month.value;
            month--;
            _.formatTable({'year':year,'month':month,'day':_.currentMonthDay});
            if(month==0){
                _.formatSetting(--year);
            }
        };
        _.$next_month.onclick = function(){
            let year = _.$year.value;
            let month = _.$month.value;
            month++;
            _.formatTable({'year':year,'month':month,'day':_.currentMonthDay});
            if(month==13){
                _.formatSetting(++year);
            }
        };
        _.$tbody.onclick = function(event){
            event = event || window.event;
            let target = event.target || event.srcElement;
            while(target.tagName!='TD'&&target.tagName!='TABLE'){
                target = target.parentNode;
            }
            let id = target.getAttribute('data-id');
            if(target.tagName=='TD'&&id){
                let data = _.currentMonthData[id];
                _.currentMonthDay = data['sDay'];
                let that_date = getDateString(data['sYear'],data['sMonth'],data['sDay']);
                if(that_date!=_.date){
                    _.setAttribute('date',that_date);
                }
                _.dispatchEvent(new CustomEvent('onSelect',{'detail':calendar.getDateBySolar(data['sYear'],data['sMonth'],data['sDay'])}));
            }
        };
        _.formatDate(_.date);
        setTimeout(function(){
            _.dispatchEvent(new CustomEvent('onInit',{'detail':_.currentDateInfo}));
        },1);
    }
    static get observedAttributes(){
        return ['date'];
    }
    attributeChangedCallback(name, oldValue, newValue){
        let _ = this;
        if(!oldValue){
            return false
        }
        if(name=='date'){
            _.formatDate(newValue);
        }
    }
    render(){
        this.shadowRoot.innerHTML = `<div class="mod-calendar">
            <div class="info"></div>
            <div class="box">
                <div class="selector">
                    <span>
                        <a class="prev prev-year" href="javascript:;">&lt;</a>
                        <select class="year">
                            `+(function(){
                                let list = [];
                                for(let i=1900;i<=2100;i++){
                                    list.push('<option value="'+i+'">'+i+'年</option>');
                                }
                                return list;
                            })()+`
                        </select>
                        <a class="next next-year" href="javascript:;">&gt;</a>
                    </span>
                    <span>
                        <a class="prev prev-month" href="javascript:;">&lt;</a>
                        <select class="month">
                            `+(function(){
                                let list = [];
                                for(let i=1;i<=12;i++){
                                    list.push('<option value="'+i+'">'+i+'月</option>');
                                }
                                return list;
                            })()+`
                        </select>
                        <a class="next next-month" href="javascript:;">&gt;</a>
                    </span>
                    <span>
                        <select class="holiday">
                            <option value="">假日安排</option>
                        </select>
                    </span>
                    <a class="goback" href="javascript:;">返回今天</a>
                </div>
                <div class="table">
                    <table>
                        <thead>
                            <tr><th>日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th></tr>
                        </thead>
                        <tbody>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;
    }
    addStyle(){
        const $style = document.createElement('style');
        $style.textContent = `
            :host {
                display: inline-block;
                width: 600px;
                white-space: initial;
                font-size: 14px;
                font-family: Arial,Helvetica,"Microsoft Yahei";
                color: #333;
                --primary-color: #2095f2;
                --secondary-color: #ffaa00;
            }
            *{
                padding:0;
                margin:0;
            }
            a{
                text-decoration: none;
                color:#333;
            }
            .mod-calendar {
                padding: 2px;
                background: var(--primary-color);
            }
            .mod-calendar .info {
                float: right;
                position: relative;
                width: 180px;
                padding-top: 15px;
                text-align: center;
                color: #fff;
            }
            .mod-calendar .info a{
                color: #fff;
            }
            .mod-calendar .info p {
                line-height: 20px;
            }
            .mod-calendar .info .day {
                width: 80px;
                height: 80px;
                margin: 15px auto;
                line-height: 80px;
                font-size: 48px;
                background: var(--secondary-color);
                color: #fff;
                border-radius: 8px;
            }
            .mod-calendar .info .detail{
                margin-bottom: 15px;
            }
            .mod-calendar .info .list{
                padding: 10px 0;
                border-top: 1px dotted rgba(255,255,255,0.5);
            }
            .mod-calendar .info .list .item{
                padding: 5px 0;
            }
            .mod-calendar .info .list .item a{
                color: #fff;
            }
            .mod-calendar .info .list ::slotted([slot="item"]) {
                padding: 5px 0!important;
            }
            .mod-calendar .box {
                margin-right: 180px;
                background: #fff;
            }
            .mod-calendar .selector {
                position: relative;
                padding: 5px 12px;
                vertical-align: middle;
                overflow: hidden;
            }
            .mod-calendar .selector span {
                float: left;
            }
            .mod-calendar .selector a {
                float: left;
                position: relative;
                height: 24px;
                padding: 0 5px;
                border: 1px solid #ebebeb;
                background: #fafafa;
                line-height: 24px;
                vertical-align: middle;
            }
            .mod-calendar .selector a:hover {
                border-color: var(--secondary-color);
                color: var(--secondary-color);
            }
            .mod-calendar .selector .goback {
                margin-left: 7px;
            }
            .mod-calendar .selector .prev {
                left: 1px;
            }
            .mod-calendar .selector .next {
                margin-right: 7px;
                right: 1px;
            }
            .mod-calendar .selector select {
                float: left;
                min-width: 60px;
                height: 26px;
                padding-left: 4px;
                border: 1px solid #ebebeb;
                background: #fff;
                line-height: 24px;
                vertical-align: middle;
                font-size: 14px;
                color: #333;
                outline: none;
            }
            .mod-calendar .selector button {
                height: 26px;
                border: 1px solid #ebebeb;
                line-height: 24px;
                background: #fafafa;
            }
            .mod-calendar table {
                width: 100%;
                table-layout: fixed;
                color: #666;
                border-collapse: collapse;
                border-spacing: 0;
            }
            .mod-calendar table tr {
                border-top: 1px solid #ebebeb;
            }
            .mod-calendar table th,.mod-calendar table td {
                position: relative;
                border: 1px solid #ebebeb;
                text-align: center;
            }
            .mod-calendar table th {
                line-height: 32px;
                font-weight: normal;
            }
            .mod-calendar table td {
                position: relative;
                line-height: 20px;
            }
            .mod-calendar table thead {
                background: #f8f8f8;
            }
            .mod-calendar table tbody a {
                display: block;
                position: relative;
                margin: 0 auto;
                padding: 7px 0;
                border: 1px solid transparent;
                cursor: pointer;
            }
            .mod-calendar table tbody a:hover {
                border: 1px solid #cccccc;
            }
            .mod-calendar table tbody span {
                display: block;
                overflow: hidden;
                white-space: nowrap;
                text-overflow: ellipsis;
            }
            .mod-calendar table tbody i {
                position: absolute;
                left: 2px;
                top: 0;
                line-height: 20px;
                font-style: normal;
                color: #fff;
            }
            .mod-calendar table .s1 {
                font-size: 18px;
                color: #212121;
            }
            .mod-calendar table .s2 {
                font-size: 13px;
                color: #757575;
            }
            .mod-calendar table td.active a {
                border: 1px solid var(--secondary-color);
            }
            .mod-calendar table td.holiday a {
                background: #f1f9f1
            }
            .mod-calendar table td.holiday.active a,.mod-calendar table td.holiday a:hover{
                border: 1px solid #4bae4f;
            }
            .mod-calendar table td.holiday i {
                color: #4bae4f;
            }
            .mod-calendar table td.today{
                background: var(--secondary-color);
            }
            .mod-calendar table td.today a{
                border: 1px solid var(--secondary-color);
            }
            .mod-calendar table td.today .s1{
                color: #fff;
            }
            .mod-calendar table td.today .s2{
                color: rgba(255,255,255,0.8);
            }
            .mod-calendar table td.work a {
                background: #fef0ef;
            }
            .mod-calendar table td.work.active a,.mod-calendar table td.work a:hover{
                border: 1px solid #f44336;
            }
            .mod-calendar table td.work i {
                color: #f44336;
            }
            .mod-calendar table td.disabled a {
                opacity: 0.4;
            }
            @media screen and (max-width: 640px) {
                :host{
                    width: 100%;
                }
                .mod-calendar{
                    margin-bottom: 12px;
                    font-size: 12px;
                }
                .mod-calendar .info{
                    float: none;
                    width: auto;
                    padding-top: 10px;
                    padding-left: 10px;
                    overflow:hidden;
                }
                .mod-calendar .info p{
                    text-align: left;
                }
                .mod-calendar .info .day{
                    float: left;
                    width: 58px;
                    height: 58px;
                    margin: 6px 0;
                    line-height: 58px;
                    font-size: 24px;
                }
                .mod-calendar .info .detail{
                    padding-top: 5px;
                    margin-left: 70px;
                    margin-bottom: 10px;
                }
                .mod-calendar .info .list{
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    padding:0;
                    border-top: none;
                    text-aign: right;
                }
                .mod-calendar .info .list .item{
                    padding: 2px 0;
                }
                .mod-calendar .info .list ::slotted([slot="item"]) {
                    padding: 2px 0!important;
                }
                .mod-calendar .box{
                    margin-right: 0;
                }
                .mod-calendar .selector span{
                    float: left;
                    position: relative;
                    width: 33.33%;
                    border: 1px solid #ebebeb;
                    margin-right: -1px;
                    text-align: center;
                    box-sizing: border-box;
                }
                .mod-calendar .selector select{
                    float: none;
                    border-color: transparent;
                    padding-left:0;
                }
                .mod-calendar .selector a{
                    position: absolute;
                    top:0;
                    background: none;
                    border-color: transparent;
                }
                .mod-calendar .selector .prev{
                    left: 0;
                    border-right-color: transparent;
                }
                .mod-calendar .selector .next{
                    right: 0;
                    margin-right: 0;
                    border-left-color: transparent;
                }
                .mod-calendar .selector .goback{
                    position: absolute;
                    top: 75px;
                    right: 10px;
                    height: 20px;
                    background: #ffbb00;
                    line-height: 20px;
                    font-size: 14px;
                    color: #fff;
                    border-radius: 3px;
                }
                .mod-calendar .selector .goback:hover{
                    border-color:#ffbb00;
                    color: #fff;
                }
                .mod-calendar table tbody a{
                    width: auto;
                }
                .mod-calendar table tr{
                    border-top: none;
                }
                .mod-calendar table th, .mod-calendar table td{
                    position: relative;
                }
                .mod-calendar table td{
                    height: 48px;
                    line-height: 16px;
                }
                .mod-calendar table .s2{
                    font-size: 12px;
                }
                .mod-calendar table td a.active, .mod-calendar table td a:hover{
                    padding: 7px 1px;
                }
            }
        `;
        this.shadowRoot.appendChild($style);
    }
    formatTable(param){
        let _ = this;
        let thatDay = _.today;
        if(param){
            thatDay = calendar.getDateBySolar(+param['year'],+param['month'],+param['day']);
        }
        let that_date = getDateString(thatDay['sYear'],thatDay['sMonth'],thatDay['sDay']);
        //获取日历信息
        let firstDay = calendar.getDateBySolar(thatDay['sYear'],thatDay['sMonth'],1);
        let monthDays = getSolarMonthDays(thatDay['sYear'],thatDay['sMonth']);
        _.currentMonthData = [];
        // 上月日期
        for(let i=firstDay['week'];i>0;i--){
            let obj = calendar.getDateBySolar(firstDay['sYear'],firstDay['sMonth'],firstDay['sDay']-i);
            _.currentMonthData.push(obj);
        }
        // 当月日期
        for(let i=0;i<monthDays;i++){
            let obj = calendar.getDateBySolar(firstDay['sYear'],firstDay['sMonth'],firstDay['sDay']+i);
            _.currentMonthData.push(obj);
        }
        // 下月日期
        let lastDay = _.currentMonthData.at(-1);
        for(let i=1;lastDay['week']+i<7;i++){
            let obj = calendar.getDateBySolar(lastDay['sYear'],lastDay['sMonth'],lastDay['sDay']+i);
            _.currentMonthData.push(obj);
        }
        // 是否增加一行
        if(_.currentMonthData.length<=35){
            let lastDay = _.currentMonthData.at(-1);
            for(let i=1;_.currentMonthData.length<42;i++){
                let obj = calendar.getDateBySolar(lastDay['sYear'],lastDay['sMonth'],lastDay['sDay']+i);
                _.currentMonthData.push(obj);
            }
        }

        // 格式化结构
        let map = {
            'work':'班',
            'holiday':'休'
        };
        let html = '<tr>';
        for(let i=0,len=_.currentMonthData.length;i<len;i++){
            let item = _.currentMonthData[i];
            let item_date = getDateString(item['sYear'],item['sMonth'],item['sDay']);
            let classnameList = [];
            if(item_date==that_date){
                classnameList.push('active');
            }
            if(item['sYear']!=thatDay['sYear']||item['sMonth']!=thatDay['sMonth']){
                classnameList.push('disabled');
            }
            if(item['date']==_.today['date']){
                classnameList.push('today');
            }
            let sign = '';
            if(scheduleMap[item['sYear']]){
                let holiday = scheduleMap[item['sYear']];
                let dateStr = getDateString(item['sMonth'],item['sDay']);
                if(typeof holiday[dateStr] != 'undefined'){
                    sign = holiday[dateStr]?'holiday':'work';
                    classnameList.push(sign);
                }
            }
            let festivals = item['festival'].split(' ').filter(function(value){
                if(value.length<=3){
                    return Object.values(sFestival).includes(value)||Object.values(lFestival).includes(value)||Object.values(oFestival).includes(value)||Object.values(tFestival).includes(value);
                }
            });
            let festival = festivals.length?festivals[0]:'';
            html += `<td class="`+classnameList.join(' ')+`" data-id="`+i+`">
                <a href="javascript:;">
                    <span class="s1">`+item['sDay']+`</span>
                    <span class="s2">`+(item['term']||festival||item['lDayZH'])+`</span>
                    `+(sign&&map[sign]?'<i>'+map[sign]+'</i>':'')+`
                </a>
            </td>`;
            if(i%7==6&&i<len-1){
                html+='</tr><tr>';
            }
        }
        html+='</tr>';
        _.$year.value = thatDay['sYear'];
        _.$month.value = thatDay['sMonth'];
        _.$info.innerHTML = `<p>${that_date} ${thatDay['weekZH']}</p>
            <div class="day">${thatDay['sDay']}</div>
            <div class="detail">
                <p>${thatDay['lMonthZH']}${thatDay['lDayZH']}</p>
                <p>${thatDay['gzYearZH']}年 【${thatDay['animal']}年】</p>
                <p>${thatDay['gzMonthZH']}月 ${thatDay['gzDayZH']}日</p>
            </div>
            <div class="list">
                <slot name="item"></slot>
                <div class="item">${thatDay['festival'].trim().split(' ').map(value=>`<p>${value}</p>`).join('')}</div>
            </div>
        `;
        _.$tbody.innerHTML = html;

        _.currentDateInfo = thatDay;
        _.dispatchEvent(new CustomEvent('onChange',{'detail':thatDay}));
    }
    formatSetting(year){
        let _ = this;
        year = year||(new Date()).getFullYear();
        _.$holiday.innerHTML = '';
        let $o = new Option("假日安排","");
        _.$holiday.add($o);
        if(holidayMap[year]){
            let items = holidayMap[year];
            for(let i=0;i<items.length;i++){
                let $option = new Option(items[i]['name'],items[i]['value']);
                _.$holiday.add($option);
            }
        }else{
            const list = ['元旦','春节','清明','劳动节','端午节','中秋节','国庆节'];
            for(let m=1;m<=12;m++){
                for(let d=1;d<=31;d++){
                    let date = calendar.getDateBySolar(year,m,d);
                    if(date['sMonth']==m&&date['sDay']==d){
                        let types = [];
                        if(date['term']){
                            types.push(date['Term']);
                        }
                        if(date['festival']){
                            types = [].concat(types,date['festival'].split(' '));
                        }
                        types.forEach(function(type){
                            if(list.indexOf(type)>-1){
                                let $option = new Option(type,date['sYear']+'-'+date['sMonth']+'-'+date['sDay']);
                                _.$holiday.add($option);
                            }
                        });
                    }
                }
            }
        }
    }
    formatDate(date){
        let _ = this;
        _.date = date;
        if(_.date){
            let [year,month,day] = _.date.split('-');
            _.formatTable({'year':year,'month':month,'day':day});
            _.formatSetting(year);
        }else{
            _.formatTable();
            _.formatSetting();
        }
    }
}

if(!customElements.get('widget-calendar')){
    customElements.define('widget-calendar', WidgetCalendar);
}
