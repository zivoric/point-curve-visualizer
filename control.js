const pointList = $("#point-list");
const pointElement = "<div class=\"point-element\"><span>(</span><div class=\"point-input\" name=\"x\" contenteditable></div><span>,</span><div class=\"point-input\" name=\"y\" contenteditable></div><span>)</span><button class=\"remove\">-</button></div>";
pointList.append(pointElement);

$(document).on('click','.point-element button.remove',function() {
    if ($('#point-list .point-element').length > 1) {
        $(this).parent().remove();
        $(document).trigger("updateList");
    }
});

$(document).on('input change updateList', function() {
    let points = [];
    $('#point-list .point-element').each(function(index) {
        let x = parseFloat($(this).children("div[name=x]").text());
        let y = parseFloat($(this).children("div[name=y]").text());
        if (!isNaN(x) && !isNaN(y)) {
            points.push([x,y]);
        }
    });
    options.points = points;
    updateInformation();
});

$(document).on('updateInformation', function(event, points, values) {
    let funcString = "";
    for (let i = 0; i < values.length; i++) {
        let value = values[i];
        if (isNaN(value)) {
            funcString = "";
            break;
        }
        if (value == 0) {
            continue;
        }
        else if (value < 0) {
            if (i == 0)
                funcString += "-";
            else
                funcString += " - ";
        }
        else if (value > 0 && funcString != "") {
            funcString += " + ";
        }
        if (Math.abs(value) != 1 || i == 0) {
            funcString += Math.round(Math.abs(value)*10000)/10000;
        }
        if (i >= 1) {
            funcString += "x";
        }
        if (i >= 2) {
            funcString += "<sup>"+i+"</sup>";
        }
    }
    if (funcString == "") {
        funcString = "none";
    }
    $('#equation div:last-child').html(funcString);
});

$('#options button[name="add"]').on("click", function() {
    pointList.append(pointElement);
});

$('#options #points').on("change", function() {
    options.showPoints = this.checked;
});
$('#options #line').on("change", function() {
    options.showLine = this.checked;
});
$('#options #derivative').on("change", function() {
    options.drawDerivative = this.checked;
});

//let numberRegex = /[+-]?([0-9]*[.])?[0-9]*/s;
$(".point-input").on('input', function() {
    let selection = window.getSelection();
    let originalRange = selection.getRangeAt(0);
    let range = document.createRange();
    let start = originalRange.startOffset;
    let end = originalRange.endOffset;
    let contents = $(this).html().replace(/(<.+?>)/gs,'');
    let numberResults = [...contents.matchAll(/[^0-9]/gs)];
    let allowDecimal = true;
    let errorsBefore = 0;
    let errorsBetween = 0;
    for (let result of numberResults) {
        if (result.index == 0 && (result[0] == '+' || result[0] == '-')) {
            continue;
        } else if (allowDecimal && result[0] == '.') {
            allowDecimal = false;
            continue;
        } else {
            if (result.index < start)
                errorsBefore++;
            else if (result.index < end) {
                errorsBetween++;
            }
            contents = contents.substring(0, result.index) + '!' + contents.substring(result.index+1);
        }
    }
    contents = contents.replaceAll('!', '');
    $(this).html(contents);
    if (selection.focusNode.firstChild != null) {
        range.setStart(selection.focusNode.firstChild, start-errorsBefore);
        range.setEnd(selection.anchorNode.firstChild, end-errorsBefore-errorsBetween);
        selection.removeAllRanges();
        selection.addRange(range);
    }
});