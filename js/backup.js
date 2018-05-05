/*
* 基于LL(1)文法的预测分析程序
* 输入：符号串
* 输出：语法树（分析过程）
* */

/*
* 1.思路：先定义基本的LL(1)文法；(消除左递归，消除回溯、提取左因子)
* 2.求出各个终结符的FOLLOW集与FIRST集
* 3.构造预测分析表
* 4.构建分析栈过程
* */

/*
* M -> i=E
* E -> E+T|E-T|T
* T -> T*F|T/F|F
* F -> (E)|i

* 消除左递归:
* M -> i=E
* E -> TK
* K -> +TK
* K -> -TK
* K -> @(NULL)
* T -> FG
* G -> *FG
* G -> /FG
* G -> @(NULL)
* F -> (E)
* F -> i
* */

/*FIRST(M)={i}      FOLLOW(M)={#}
* FIRST(E)={(,i}    FOLLOW(E)={#,)}
* FIRST(K)={+,-,@}  FOLLOW(K)={#,)}
* FIRST(T)={(,i}    FOLLOW(T)={#,),+,-}
* FIRST(G)={*,/,@}  FOLLOW(G)={#,),+,-}
* FIRST(F)={(,i}    FOLLOW(F)={#,),*,/,+,-}
* */

/*预测分析表
*     =   +   -  /  (   )   *   i   #
* M                            i=E
* E                 TK          TK
* K     +TK  -TK        @           @
* T                 FG          FG
* G      @    @  /FG     @  *FG     @
* F                 (E)         i
* /
    /*使用一个对象储存文法 @代表空字*/
let grammar = {
    'M': 'i=E',
    'E': 'TK',
    'K': '+TK|-TK|@',
    'T': 'FG',
    'G': '*FG|/FG|@',
    'F': '(E)|i'
};
/*非终结符集*/
const UN_TERMINAL = ['M', 'E', 'K', 'T', 'G', 'F'];
/*终结符集*/
const TERMINAL = ['=', '+', '-', '/', '(', ')', '*', 'i', '#'];

/*FIRST集表*/
let FIRST_table = {};
/*FOLLOW集表*/
let FOLLOW_table = {};
/*预测分析表*/
let predict_table = [];
/*语法分析结果表：[栈情况，剩余分析串,动作]*/
let predict_result_table = new Vue({
    el: '#predict_table',
    data: {
        result:[

        ]
    }
});
let operationPredict = function() {
    /*数组去重加入*/
    Array.prototype.uniquePush = function (source) {
        //检测数组元素是否有重复再决定是否push进数组
        let target = this; //被填充数组
        for(let i = 0; i < source.length; i++) {
            if(target.indexOf(source[i]) === -1){
                target.push(source[i]);
            }
        }
    };
    /*构造FIRST集*/
    let getFirst = function(ch) {
        if(ch === '@' || TERMINAL.indexOf(ch) !== -1) {
            //终结符直接返回
            return ch;
        }
        if(FIRST_table.hasOwnProperty(ch)) {
            //如果表中已有，无需更新直接返回副本
            return FIRST_table[ch].slice(0); //！！直接返回FIRST_table[ch]可能造成对FIRST集的修改
        }
        let temp_table = []; //用来暂时存放first集
        let product = grammar[ch].split('|'); //获得产生式数组
        for(let j = 0; j < product.length; j++) {
            let first_ch = product[j].charAt(0);
            if(TERMINAL.indexOf(first_ch) !== -1 || first_ch === '@') {
                //产生式首字符为终结符或空字
                temp_table.uniquePush(first_ch);
            }
            else if(UN_TERMINAL.indexOf(first_ch) !== -1) {
                //产生式首字符为非终结符,递归，将结果添加至当前数组中
                let result =  getFirst(first_ch);
                //检测是否含空字
                let hasNull = result.indexOf('@');
                //如果有空字，从第二个字符开始检测
                let k = 1;
                for(; k < product[j].length && hasNull !== -1; k++) {
                    //存在空字
                    result.splice(hasNull, 1);
                    temp_table.uniquePush.apply(temp_table, result);
                    if(TERMINAL.indexOf(first_ch) !== -1) {
                        break;
                    }
                    result =  getFirst(product[j].charAt(k));
                    hasNull = result.indexOf('@');
                }
                if(k === product[j].length && hasNull !== -1){
                    //所有非终结符均含有空字
                    temp_table.uniquePush('@');
                }
                temp_table.uniquePush(result);
            }
        }
        FIRST_table[ch] = temp_table.slice(0);
        return FIRST_table[ch];
    };

    /*构造FOLLOW集*/
    let getFollow = function(ch) {
        //每次遍历文法
        //(2) 若A->aBb是一个产生式,则把FIRST(b)\{ε}加至FOLLOW(B)中;
        //(3) 若A->aB是一个产生式,或A->aBb是一个产生式而b=>ε(即ε∈FIRST(b))则把FOLLOW(A)加至FOLLOW(B)中
        if(FOLLOW_table.hasOwnProperty(ch)) {
            return FOLLOW_table[ch];
        }
        let temp_table = [];
        for(let left in grammar) {
            if(grammar.hasOwnProperty(left)) {
                let products = grammar[left].split('|'); //右部产生式
                for(let i = 0; i < products.length; i++) {
                    let product = products[i];
                    let len = product.length;
                    if(product[len-1] === ch) {
                        //A->aB
                        if(left !== ch){
                            //将产生式左部FOLLOW集加入，如果左部是本身，跳过
                            temp_table.uniquePush(getFollow(left));
                        }
                    }
                    if(product[len-2] === ch) {
                        //A->aBb
                        let first_b = getFirst( product[len-1]);//将要被加入的FIRST集符号b
                        let nullIndex = first_b.indexOf('@'); //检查是否为空
                        if(nullIndex !== -1){
                            if(left !== ch){
                                //将产生式左部FOLLOW集加入，如果左部是本身，跳过
                                temp_table.uniquePush(getFollow(left));
                            }
                            first_b.splice(nullIndex, 1)
                            temp_table.uniquePush(first_b);
                        } else {
                            temp_table.uniquePush(first_b);
                        }
                    }
                }
            }
        }
        FOLLOW_table[ch] = temp_table.slice(0);
        //默认UN_TERMINAL表中第一个为开始符号，添加'#‘号
        if(ch === UN_TERMINAL[0]){
            FOLLOW_table[UN_TERMINAL[0]].push('#');
        }
        return FOLLOW_table[ch].slice(0);
    };

    /*构造预测分析表*/
    let getPredictionAnalysisTable = function() {
        //非终结符为表行，终结符为表列
        //(1) 对文法G的每个产生式A->a执行第二步和第三步;
        //(2) 对每个终结符a∈FIRST(a),把A->a加至M[A,a]中;
        //(3) 若ε∈FIRST(a),则把任何b∈FOLLOW(A)把A->a加至M[A,b]中;
        //(4) 把所有无定义的M[A,a]标上出错标志.
        for(let i = 0; i < UN_TERMINAL.length; i++) {
            //初始化
            predict_table[i] = [];
            for(let j = 0; j < TERMINAL.length; j++) {
                predict_table[i][j] = "error";
            }
        }
        for(let vt in grammar) {
            let products = grammar[vt].split("|");
            let row_index = UN_TERMINAL.indexOf(vt);
            for(let k = 0; k < products.length; k++) {
                let first_ch = products[k].charAt(0);
                let FIRST_set = getFirst(first_ch);
                for(let i = 0; i < FIRST_set.length; i++) {
                    let col_index = TERMINAL.indexOf(FIRST_set[i]);
                    if(col_index !== -1)
                        predict_table[row_index][col_index] = products[k];
                    if(FIRST_set.indexOf('@') !== -1) {
                        let FOLLOW_set = getFollow(vt);
                        for(let j = 0; j < FOLLOW_set.length; j++) {
                            col_index = TERMINAL.indexOf(FOLLOW_set[j]);
                            predict_table[row_index][col_index] = products[k];
                        }
                    }
                }
            }
        }
    };

    return {
        getFirst: getFirst,
        getFollow: getFollow,
        getPredictionAnalysisTable: getPredictionAnalysisTable
    }
};

let $ = operationPredict();
/*主控程序*/
let mainControl = function(str) {
    //test_string = i=i*i-(i+i)
    let analysis_stack = []; //分析栈，栈底首先置‘#’与文法开始符号入栈
    analysis_stack.push('#');
    analysis_stack.push(UN_TERMINAL[0]);
    let index = 0;            //当前读入位置
    let ch = str.charAt(index++); //当前读入符号
    let flag = true;
    while(flag) {
        let rs = { //这一步要插入的表目
            stack: analysis_stack.join(""),
            string: str.slice(index-1),
            action: ''
        };
        if(index > str.length) {
            console.error("源字符有误！");
            flag = false;
            continue;
        }
        console.log("开始目前栈情况:" + analysis_stack.join("") + " 面临符号：" + ch);
        let top = analysis_stack[analysis_stack.length-1]; //获得栈顶符号
        if(TERMINAL.indexOf(top) !== -1 && top === ch) { //X=a
            if(top === '#') { //X=a=#,宣布分析成功，停止分析过程
                rs.action = 'Accepted';
                predict_result_table.result.push(rs);
                console.log("success!");
                flag = false;
            } else {  //X=a!=#，把X从栈中弹出，读入下一个输入符号
                rs.action = ch + '匹配';
                predict_result_table.result.push(rs); //更新结果集
                analysis_stack.pop();
                ch = str.charAt(index++);
            }
        }
        else if(UN_TERMINAL.indexOf(top) !== -1) { //top为非终结符，查表
            let row = UN_TERMINAL.indexOf(top);
            let col = TERMINAL.indexOf(ch);
            let product = predict_table[row][col];
            if(product === 'error') {
                console.error("ERROR");
                flag = false;
                continue;
            }
            rs.action = product;
            predict_result_table.result.push(rs);
            analysis_stack.pop(); //弹出X
            if(product !== '@') {
                for(let i = product.length - 1; i >= 0; i--) {
                    analysis_stack.push(product[i]); //更新栈顶情况
                }
            }
        }
        console.log("结束目前栈情况:" + analysis_stack.join("") + " 面临符号：" + ch);
    }

};
let getFIRSTAndFOLLOW = function() {
    for(let i = 0; i < UN_TERMINAL.length; i++ ) {
        if(!FIRST_table.hasOwnProperty(UN_TERMINAL[i])) {
            $.getFirst(UN_TERMINAL[i]);
        }
    }
    for(let j = 0; j < UN_TERMINAL.length; j++) {
        if(!FOLLOW_table.hasOwnProperty(UN_TERMINAL[j])) {
            $.getFollow(UN_TERMINAL[j]);
        }
    }
};
let getPredictTable = function() {
    $.getPredictionAnalysisTable();
};
let showUp = function() {
    //输出FIRST集FOLLOW集与预测分析表信息
    for(let v in FIRST_table) {
        if(FIRST_table.hasOwnProperty(v)) {
            console.log("FIRST(" + v + "){" + FIRST_table[v].join(',') + "}" + "\t\t\t\t FOLLOW(" + v + "){" + FOLLOW_table[v] + "}");
        }
    }
    console.log("\n预测分析表");
    let str = '\t';
    for(let i = 0; i < predict_table[0].length; i++) {
        str += "\t" + TERMINAL[i] + "\t    ";
    }
    console.log(str);
    for(let i = 0; i < predict_table.length; i++) {
        str = UN_TERMINAL[i];
        for(let j = 0; j < predict_table[0].length; j++) {
            let data = predict_table[i][j]
            for(let m = 0; m < 5 - data.length; m++){
                data += " ";
            }
            str += "\t" + data + "\t";
        }
        console.log(str);
    }
};
let predict_process = function(result) {
    //从词法分析器获得结果集
    let str = '';
    for(let i = 0;i < result.length; i++) {
        if(result[i][1] === 'IDENTITY_WORD' || result[i][1] === 'CONST_WORD') {
            str += 'i';
        } else if(/(?:opt\w+)|(?:bor\w+)/.test(result[i][1])){
            str += result[i][0];
        }
    }
    str += '#';
    console.log(str);
    getFIRSTAndFOLLOW();
    getPredictTable();
    mainControl(str);
};
