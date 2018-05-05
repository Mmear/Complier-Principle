window.onload = function () {
    function handleFiles(files) {
        if(files.length) {
            let file = files[0];
            let reader = new FileReader();
            console.log(file.type);
            if(/text\/\w+/.test(file.type)) {
                reader.onload = function () {
                    let ele = document.createElement("pre");
                    let text = document.createTextNode(reader.result);
                    ele.appendChild(text);
                    document.getElementById("source_code").appendChild(ele);
                    let result = word_analysis(text.wholeText); //调用词法分析程序
                    predict_process(result); //调用预测分析程序
                };
                reader.readAsText(file);
            }
        }
    }

    let filer = document.getElementById('file');
    filer.addEventListener('change', function (event) {
        let f = event.target;
        handleFiles(f.files);
    });
};