/**
 * 简易词法分析程序
 * 读入：分析串(源程序)
 * 输出：
 *      <保留字||运算符||界符，种别码>
 *      <常数const_word，数值>
 *      <标识符identity_word, 值>
 */

    let reserved_word = {
            'var': 'reID0',
            'function': 'reID1',
            'if': 'reID2',
            'else': 'reID3',
            'while': 'reID4',
            'return': 'reID5',
            'true': 'retID7',
            'false': 'retID8'
        }, //保留字
        operator_word = {
            '+': 'opt_plus',
            '-': 'opt_subtract',
            '*': 'opt_multiply',
            '/': 'opt_divide',
            '=': 'opt_assign',
            '<': 'opt_less',
            '>': 'opt_more',
            '==': 'opt_equal'
            //<= . >= , ==
        }, //运算符
        border_word = {
            '(': 'bor_lBracket',
            ')': 'bor_rBracket',
            '{': 'bor_lBrace',
            '}': 'bor_rBrace',
            ',': 'bor_comma',
            ';': 'bor_mark',
            '\'': 'bor_singleQuote',
            '\"': 'bor_doubleQuote'
        }; //界符
    const CONST_WORD = 'CONST_WORD';
    const IDENTITY_WORD = 'IDENTITY_WORD';
    let const_table = {}; //常数表
    let identity_table = {}; //标识符表
    let result_table = [];//结果表，用于下一步的语法分析
    function operation(str) {
        let index = 0, //记录单前读取字符的位置
            len = str.length, //读入字符串的长度
            ch = '', //字符变量，用于读最新进的源程序字符
            strToken = ''; //用于存放构成单词符号的字符串

        //编译预处理，去除字符和注释
        let filterResource = function() {
            let tempStr = str.slice(0); //复制字符串
            str = ""; //源字符串置空
            for(let i = 0; i < len; i++) {
                let ch_now = tempStr.charAt(i);
                let ch_next = tempStr.charAt(i + 1); //超出会返回空字符
                if(ch_now === '/' && ch_next === '/') {
                    /*若为单行注释，跳转至行尾*/
                    while(tempStr.charAt(i) !== '\n') {
                        i++;
                    }
                }
                if(ch_now === '/' && ch_next === '*') {
                    /*若为多行注释，跳转至段注释末尾*/
                    i += 2;
                    while(tempStr.charAt(i) !== '*' || tempStr.charAt(i + 1) !== '/') {
                        if(i === length - 2) {
                            console.log("没有找到段注释终止符！");
                            return "";
                        } else {
                            i++;
                        }
                    }
                    //避免两段不同种注释黏在一起的情况
                    i ++;
                    continue;
                }
                ch_now = tempStr.charAt(i);//更新当前字符
                if(ch_now !== '\n'
                    && ch_now !== '\t'
                    && ch_now !== '\v'
                    && ch_now !== '\r'
                ) {
                    str += ch_now;
                }
            }
            len = str.length;
            return str; //返回过滤后的字符串
        };
        //子程序过程，用于将下一读取字符读入至ch中
        let getChar = function() {
            ch = (index < len) && str.charAt(index++);
        };
        //子程序过程，检查ch中的字符是否为空白。若是则调用GetChar直至读入一个非空白符
        let getBC = function() {
            while(/\s/.test(ch) && index < len) {
                getChar(index);
            }
            //console.log(ch);
        };
        //子程序过程，将ch中的字符连接到strToken之后；
        let concat = function() {
            strToken += ch;
        };
        //子程序过程，判断ch中的字符是否为字母和数字
        let isLetter = function() {
            let rep = new RegExp(/[a-z]/);
            return rep.test(ch);
        };
        let isDigits = function() {
            let rep = new RegExp(/[0-9]/);
            return rep.test(ch);
        };
        //判断ch中的字符是否为运算符或界符
        let isOptOrBorder = function() {
            if(operator_word.hasOwnProperty(ch)) {
                return [ch, operator_word[ch]];
            } else if(border_word.hasOwnProperty(ch)) {
                return [ch, border_word[ch]];
            } else {
                return 0;
            }
        };
        //整形函数过程，对strToken中的字符串查找保留字表，若它是一个保留字
        //则返回它的编码，否则返回0值(标识符)
        let isReserve = function() {
            if(reserved_word.hasOwnProperty(strToken)) {
                return [strToken, reserved_word[strToken]];
            }
            return 0;
        };
        //子程序过程，将搜索指示器index后退一位，将ch置空
        let retract = function() {
            index >= 1 && index--;
            ch = '';
        };
        //整形函数过程，将strToken中的标识符插入符号表，返回符号表指针
        let insertIdentity = function() {
            //若标识符表中已经存在，则直接返回该标识符
            if(!identity_table.hasOwnProperty(strToken)) {
                //不存在则插入
                Object.defineProperty(identity_table, strToken, {
                    value: IDENTITY_WORD,
                    configurable: true,
                    writable: false
                });
            }
            return [strToken, IDENTITY_WORD];
        };
        let insertConst = function() {
            Object.defineProperty(const_table, strToken, {
                value: CONST_WORD,
                configurable: true,
                writable:false
            });
            return [strToken, CONST_WORD];
        };
        //提供对外接口
        let isEnd = function() {
            return index !== len;
        };
        let clear = function() {
            ch = '';
            strToken = '';
        };
        return {
            filterResource: filterResource,
            getChar: getChar,
            getBC: getBC,
            concat: concat,
            isLetter: isLetter,
            isDigits: isDigits,
            isOptOrBorder: isOptOrBorder,
            isReserve: isReserve,
            retract: retract,
            insertIdentity: insertIdentity,
            insertConst: insertConst,
            isEnd: isEnd,
            clear: clear
        }
    }
    //显示函数，同时更新结果表
    let show = function(result) {
        //更新DOM
        let ele = document.createElement('span');
        let text = document.createTextNode('<' + result[0] + ', ' + result[1] + '>');
        ele.appendChild(text);
        document.getElementById('result_code').appendChild(ele);
        //更新结果表
        result_table.push([result[0], result[1]]);
    };
    //主控函数
    let main_control_word = function (str) {
        let $ = operation(str);
        let filterStr = $.filterResource(str);
        console.log(filterStr);
        let result;
        while(!!$.isEnd()) {
            $.getChar();
            $.getBC();
            //进行保留字和标识符的识别
            if($.isLetter()) {
                while($.isLetter() || $.isDigits()) {
                    $.concat();
                    $.getChar();
                }
                //读到非字符或数字，回退一格
                $.retract();
                //判断是否为保留字
                result = $.isReserve();
                if(Object.prototype.toString.apply(result) === '[object Array]') {
                    //是保留字，返回种别码与源值
                    show(result);
                    console.log('<' + result[0] + ', ' + result[1] + '>');
                } else if (result === 0) {
                    //不是保留字，,先检查标识符表中是否存在，再插入标识符表中
                    result = $.insertIdentity();
                    show(result);
                    console.log('<' + result[0] + ', ' + result[1] + '>');
                }
            }
            //进行常数的识别
            else if($.isDigits()) {
                while($.isDigits()) {
                    $.concat();
                    $.getChar();
                }
                $.retract();
                //插入常数表
                result = $.insertConst();
                show(result);
                console.log('<' + result[0] + ',' + result[1] + '>');
            }
            //进行运算符和界符的识别
            else {
                result = $.isOptOrBorder();
                if(Object.prototype.toString.apply(result) === '[object Array]') {
                    show(result);
                    console.log('<' + result[0] + ', ' + result[1] + '>');
                } else {
                    console.error("无法识别的符号！");
                }
            }
            //每进行完一次识别，都清空
            $.clear();
        }
    };
    let word_analysis = function (str) {
        main_control_word(str);
        //与语法分析器的联动
        return result_table.slice(0);
    };
