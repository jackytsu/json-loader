var MAX_HIS = 50;
var DATA_KEY = {
    'SERVER': 'server',
    'SERVER_HIS': 'server_his',
    'HEADER': 'header',
    'HEADER_HIS': 'header_his',
    'PARAMS': 'params',
    'PARAMS_HIS': 'params_his',
    'TYPE': 'type'
};

var showAlert = function(msg, cls) {
    var tmpl = ['<div class="alert alert-', cls || 'info', ' alert-fixed fade">'];
    tmpl.push('<button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>', msg, '</div>');

    var $el = $(tmpl.join('')).appendTo('body');
    setTimeout(function() {
        $el.addClass('in').delay(3000).fadeOut(function() {
            $(this).alert('close');
        });
    }, 10);
};

$(function() {
    var $server = $('#iServer'), $header = $('#iHeader'), $params = $('#iParams'), $type = $('[name=sType]'), $pre = $('pre'), $out = $('#pOut'), $loadMask = $('#loadMask');
    var $modal = $('#modalDiv'), $modalBody = $('.modal-body'), $modalLabel = $('#modalLabel'), $jsonDiv = $('#jsonDiv'), $iJsonParser = $('#iJsonParser');
    var $ddServerBtn = $server.next('div.input-group-btn').children('button'), $ddServer = $ddServerBtn.next('ul'), serverHis;
    var $ddHeaderBtn = $header.next('div.input-group-btn').children('button'), $ddHeader = $ddHeaderBtn.next('ul'), headerHis;
    var $ddParamsBtn = $params.next('div.input-group-btn').children('button'), $ddParams = $ddParamsBtn.next('ul'), paramsHis;

    var getDDMenuItem = function(str) {
        var tmpl = ['<li role="presentation"><a role="menuitem" tabindex="-1" href="#"><button type="button" class="btn btn-danger btn-sm" title="Remove this item"><span class="glyphicon glyphicon-remove-circle"></span></button>'];
        tmpl.push(str, '</a></li>');

        return tmpl.join('');
    };

    var genDDMenu = function($ddMenu, $ddMenuBtn, array) {
        var btnClear = '<li role="presentation"><a role="menuitem" tabindex="-1" href="#"><button type="button" class="btn btn-danger btn-sm" style="width: 100%;" role="clear"><span class="glyphicon glyphicon-ban-circle"></span>&nbsp;Clear</button></a></li>';
        $ddMenu.empty();
        $ddMenu.append(btnClear);
        $.each(array, function() {
            $ddMenu.append(getDDMenuItem(this));
        });
        $ddMenuBtn.attr('disabled', array.length == 0);
    };

    if (localStorage) {
        $server.val(localStorage.getItem(DATA_KEY.SERVER));
        $header.val(localStorage.getItem(DATA_KEY.HEADER));
        $params.val(localStorage.getItem(DATA_KEY.PARAMS));
        $type.filter('[value=' + localStorage.getItem(DATA_KEY.TYPE) + ']').attr('checked', true);

        serverHis = localStorage.getItem(DATA_KEY.SERVER_HIS) ? localStorage.getItem(DATA_KEY.SERVER_HIS).split(',') : [];
        genDDMenu($ddServer, $ddServerBtn, serverHis);

        headerHis = JSON.parse(localStorage.getItem(DATA_KEY.HEADER_HIS)) || [];
        genDDMenu($ddHeader, $ddHeaderBtn, headerHis);

        paramsHis = JSON.parse(localStorage.getItem(DATA_KEY.PARAMS_HIS)) || [];
        genDDMenu($ddParams, $ddParamsBtn, paramsHis);
    }

    var jsonEditorOpt = {
        appendBtn: $('#btnAppendProperty'),
        change: function(val) {
            $modal.data('json', val);
            $iJsonParser.val(JSON.stringify(val));
        }
    };

    var showOut = function(data) {
        var str = JSON.stringify(data, null, 4);
        str = str.replace(/</img, '&lt;').replace(/>/img, '&gt;');
        $out.html(str + '\n');
        $out.html(str);
        $pre.show().removeClass('prettyprinted').css('backgroundColor', '');
        $loadMask.hide();
        prettyPrint();
    };

    var showModal = function(type, json) {
        $iJsonParser.val(JSON.stringify(json));
        $modalLabel.text(type == 'header' ? 'Header Editor' : 'Parameters Editor');
        $jsonDiv.jsonEditor(json, jsonEditorOpt);
        $modal.data({
            'type': type,
            'json': json
        }).modal();
        $modalBody.css({
            'maxHeight': $('body').height() * 0.80 - 120 + 'px'
        });
        $jsonDiv.css({
            'maxHeight': $('body').height() * 0.80 - 210 + 'px'
        });
    };

    var onError = function(jqXHR, textStatus, errorThrown) {
        if (jqXHR.responseJSON) {
            showOut($.extend(jqXHR.responseJSON, {
                status: jqXHR.status
            }));
        } else {
            $out.html(jqXHR.responseText);
            $pre.show().css('backgroundColor', '#FFFFFF');
            $loadMask.hide();
        }
    };

    $header.click(function() {
        showModal('header', JSON.parse($header.val() || '{}'));
    });
    $params.click(function() {
        showModal('params', JSON.parse($params.val() || '{}'));
    });

    $('#btnClear').click(function() {
        $jsonDiv.jsonEditor({}, jsonEditorOpt);
        $modal.data({
            'json': {}
        });
    });

    $('#btnJsonParser').click(function() {
        try {
            var json = JSON.parse($iJsonParser.val());
            $jsonDiv.jsonEditor(json, jsonEditorOpt);
            $modal.data('json', json);
        } catch (e) {
            showAlert(e.message);
        }
    });

    $('#btnOK').click(function() {
        var json = $modal.modal('hide').data('json');
        if ($modal.data('type') == 'header') {
            $header.val(JSON.stringify(json));
        } else if ($modal.data('type') == 'params') {
            $params.val(JSON.stringify(json));
        }
    });

    $('#btnSubmit').click(function() {
        if (localStorage) {
            localStorage.setItem(DATA_KEY.SERVER, $server.val());
            localStorage.setItem(DATA_KEY.HEADER, $header.val());
            localStorage.setItem(DATA_KEY.PARAMS, $params.val());
            localStorage.setItem(DATA_KEY.TYPE, $type.filter(':checked').val());

            if ($.inArray($server.val(), serverHis) == -1) {
                if (serverHis.length == MAX_HIS) {
                    serverHis.shift();
                }
                serverHis.push($server.val());
                genDDMenu($ddServer, $ddServerBtn, serverHis);
            }
            localStorage.setItem(DATA_KEY.SERVER_HIS, serverHis.join(','));

            if ($.inArray($header.val(), headerHis) == -1) {
                if (headerHis.length == MAX_HIS) {
                    headerHis.shift();
                }
                headerHis.push($header.val());
                genDDMenu($ddHeader, $ddHeaderBtn, headerHis);
            }
            localStorage.setItem(DATA_KEY.HEADER_HIS, JSON.stringify(headerHis));

            if ($.inArray($params.val(), paramsHis) == -1) {
                if (paramsHis.length == MAX_HIS) {
                    paramsHis.shift();
                }
                paramsHis.push($params.val());
                genDDMenu($ddParams, $ddParamsBtn, paramsHis);
            }
            localStorage.setItem(DATA_KEY.PARAMS_HIS, JSON.stringify(paramsHis));
        }

        $pre.hide();
        $loadMask.show();
        $.ajax($server.val(), {
            headers: $header.val() ? JSON.parse($header.val()) : {},
            type: $type.filter(':checked').val(),
            data: $params.val() ? JSON.parse($params.val()) : {},
            success: function(data) {
                showOut(data);
            },
            error: onError
        });
    });

    $pre.hide();
    $loadMask.hide();

    $(document).on('click', 'ul.ddm-select li a', function() {
        var $link = $(this), $btn = $link.children('button'), $field = $link.parents('.input-group-btn').prev('input');
        $field.val($link.text().replace($btn.text(), ''));
        $link.parents('div.open').removeClass('open');
        return false;
    });

    $(document).on('click', 'ul.ddm-select li a button', function() {
        var $btn = $(this), $link = $btn.parents('a'), $ddMenu = $link.parents('div.open'), array = [];
        if ($btn.attr('role') == 'clear') {
            $ddMenu.find('button[role!="clear"]').parents('li').remove();
        } else {
            $link.parents('li').remove();
        }

        if ($ddMenu.find('li').length == 1) {
            $ddMenu.removeClass('open');
            $ddMenu.find('button').attr('disabled', true);
        } else {
            $ddMenu.find('button[role!="clear"]').parents('a').each(function() {
                var $t = $(this), $btn = $t.children('button');
                array.push($t.text().replace($btn.text(), ''));
            });
        }

        if ($ddMenu.data('type') == 'header') {
            headerHis = array;
            localStorage.setItem(DATA_KEY.HEADER_HIS, JSON.stringify(headerHis));
        } else if ($ddMenu.data('type') == 'params') {
            paramsHis = array;
            localStorage.setItem(DATA_KEY.PARAMS_HIS, JSON.stringify(paramsHis));
        } else if ($ddMenu.data('type') == 'server') {
            serverHis = array;
            localStorage.setItem(DATA_KEY.SERVER_HIS, serverHis.join(','));
        }
        return false;
    });

    $.getJSON('manifest.json', function(data) {
        var tmpl = ['JSON Loader v ', data.version, ', created by: <a href="http://jackytsu.cn" target="_blank">JackyTsu</a>', ', <a href="https://github.com/jackytsu/json-loader" target="_blank">Project on Github</a>'];
        $('#copyright').html(tmpl.join(''));
    });
});
