

var FIRST_CLICK = true;
var KEEP_LIST_HIDDEN_ONCE = false;
var URLS_PER_PAGE = 50;
var IS_CLIENT = String(window.location).indexOf('regular/client') >= 0;

$(function(){

    var $body = $('body');
    var $urlsList = $('#regular_urls_list');

    // not-paid-link action
    $urlsList.on('click', '.not-paid-link', function(){
        show_error(
            IS_CLIENT ? '<p>Страница вне лимита подписки и временно не проверяется. После оплаты страница начнет проверяться автоматически.</p>' : '<p>Страница вне лимита вашей подписки и поэтому не проверяется.</p><p>Если вы хотите, чтобы она проверялась, ' + ($('#active_pages').text() == '0' ? '<a href="/pay/#regular">возобновите подписку</a> с доступом к регулярной проверке' : '<a href="/pay/extra/">оплатите</a> дополнительные страницы для вашего аккаунта') + '.</p>',
            'Страница не оплачена');
    });
    
    // archived-link action
    $urlsList.on('click', '.archived-link', function(){
        show_message(
            'Страница в архиве', 
            IS_CLIENT ? '<p>Страница в архиве и не проверяется, пока не будет из архива восстановлена.</p>' : '<p>Эта страница в архиве и не проверяется.</p><p>Если вы хотите, чтобы она проверялась, поставьте галочку  слева от её названия и выберите под списком страниц действие "восстановить из архива".</p>');
    });
    
    // select pages' checkboxes
    $urlsList.on('click', '.action_boxes', function(event){

        // if cell is clicked, changing checkbox value
        if (event.target.nodeName != 'INPUT') {
            $(this).find('input').prop('checked', !$(this).find('input').prop('checked') );
        }
        if ($('.action_boxes input:checked').length > 0) {
            $('.action-select').val(0);
            $('.action-block').css('display', 'inline-block');
            $('a.action-block-select-all').text('снять выделение').data('flag', true);
        } else {
            $('.action-block').css('display', 'none');
            $('a.action-block-select-all').text('выделить все').data('flag', false);
        }
    });
    
    // action on selected pages (delete, archive, unarchive)
    $body.on('change', '.action-select', function(){
        if ($('.action_boxes input:checked').length < 1) {
            $('.action-select').val(0);
            return;
        }
        var pages = [];
        $('.action_boxes input:checked').each(function(){
            pages.push( $(this).val() );
        });
        pages = pages.join('|');
        
        if ($(this).val() == 'delete') {
            $('.action-block-action').val( $(this).val() );
            show_confirmation(
                'Подтвердите удаление выбранных страниц', 
                '<p>Выбранные страницы будут удалены без возможности восстановления.</p><p>Также будет удалена история проверок и их результаты.</p><p>Если вы хотите временно отключить проверку этих страниц или сохранить результаты их проверок, можете выбрать другое действие - перенести их в архив.</p>', 
                function(){
                    pages_action('delete', pages, function(data){
                        if (data.error.length < 1) {
                            show_message(
                                'Выбранные страницы удалены', 
                                '<p>Выбранные страницы и все данные об их проверках удалены.</p>'
                                );
                        }
                    });
                }, 
                function(){
                    $('#genericModal').modal('hide');
                }
            );
        }
        if ($(this).val() == 'archive') {
            $('.action-block-action').val( $(this).val() );
            pages_action('archive', pages, function(data){
                if (data.error.length < 1) {
                    show_message(
                        'Выбранные страницы перенесены в&nbsp;архив',
                        '<p>Выбранные страницы перемещены в архив — они не будут проверяться, но и учитываться при подсчете количества ваших страниц тоже не будут.</p><p>За страницы в архиве платить не нужно.</p>'
                        );
                }
            });
        }
        if ($(this).val() == 'unarchive') {
            $('.action-block-action').val( $(this).val() );
            pages_action('unarchive', pages, function(data){
                if (data.error.length < 1) {
                    var temp = '';
                    // если есть страницы сверх лимита - показываем кнопку оплаты
                    if (parseInt(data.pages_not_paid) > 0) {
                        temp = '<p><strong>После восстановленные страниц из архива некоторые из них вышли за пределы предусмотренного подпиской количества страниц. Они будут проверяться только после оплаты.</strong></p>';
                    }
                    
                    show_message(
                        'Выбранные страницы восстановлены из&nbsp;архива',
                        '<p>Выбранные страницы восстановлены из архива — они снова будут проверяться.</p>' + temp
                        );
                }
            });
        }
        $('.action-select').val(0);
    });

    // warnings
    $body.on('click', 'img.warning', function(){
        show_error($(this).attr('title'), 'При проверке возникла ошибка');
    });
    
    // open sneakpeak view of check results
    $body.on('click', 'a.sneakpeak', function(){
        $( '.short.' + $(this).attr('id') + '_holder' ).toggle();
        $( '#' + $(this).attr('id') + '_parent').toggleClass('opened');
        $(this).html( $(this).html() == '▼ кратко' ? '&#x25B2; спрятать' : '&#x25BC; кратко' );
        $(this).toggleClass('sneak_opened');
        return false;
    });
    
    // show error details
    $body.on('click', 'a.regular_err', function(){
        var error = $(this).data('err');
        if (error.match(/^\d+$/)) {
            error = error_code(error, 'website_single');
        }
        show_error( error );
        return false;
    });
    
    // hide details
    $body.on('click', 'a.closer', function(){
        $('tr.short').hide();
        $('tr.short_holder').removeClass('opened');
        return false;
    });
    
    // regular filters sorting
    $body.on('click', 'a.regular_filter:not(.inactive)', function(){
        $('a.regular_filter').removeClass('is_active');
        $(this).addClass('is_active');
        $('#pages_lister').css('left', $(this).position().left);
        
        $('#current_domen').text( $(this).data('what').match(/^\d+$/) ? '— ' + $(this).text() : '' );
        
        get_pages( $(this).data('what'), $(this).data('page') );
        return false;
    });

    // select all pages
    $body.on('click', 'a.action-block-select-all', function(){
        if ($(this).data('flag') == true) {
            $('.action_boxes input').prop('checked', false);
            $(this).data('flag', false);
            $('a.action-block-select-all').text('выделить все');
            $('.action-block').css('display', 'none');
        } else {
            $('.action_boxes input').prop('checked', true);
            $(this).data('flag', true);
            $('a.action-block-select-all').text('снять выделение');
            $('.action-block').css('display', 'inline-block');
        }
    });
    
    $('#tryer').click(function(){
        // table header
        var source   = $("#regular_urls_table_header").html();
        var template = Handlebars.compile(source);
        $urlsList.html(template);
        
        // urls list
        var source   = $("#regular_urls_table_url").html();
        var template = Handlebars.compile(source);
        var data = {urls: [
            { id: 1, matches: false },
            { id: 2, matches: true, match: [ { id: 2, "a": "b" }, { id: 2, "a": "b" }, { id: 2, "a": "b" } ] },
            { id: 3, matches: false }
            ]};
        $('#regular_urls_list table.regular_pages').append(template(data));
    });
    
    // pager click event
    $urlsList.on('click', '.regular-pagination .regular-page', function(){
        $('.regular-pagination .regular-page').removeClass('btn-primary btn-outline btn-default').addClass('btn-outline btn-default');
        $(this).addClass('btn-primary').removeClass('btn-outline btn-default');
        $('.sneakpeak.sneak_opened').click();
        $('tr.page_tr').hide();
        $('tr.page_tr:lt(' + (URLS_PER_PAGE * (parseInt($(this).data('page')) - 0)) + ')').show();
        $('tr.page_tr:lt(' + (URLS_PER_PAGE * (parseInt($(this).data('page')) - 1)) + ')').hide();
    });
    
    // client report link click event
    $urlsList.on('click', 'a.report', function(){
        var project_id = $(this).data('project_id');
        var url = 'https://content-watch.ru/regular/client/' + $('.dotted_link.regular_filter.is_active').data('client_link') + '/';
        show_confirmation(
            'Ссылка для клиента', 
            '<p>По этой ссылке клиент сможет посмотреть результаты проверки проекта:</p>'
                + '<p align="center"><a href="' + url + '">' + url + '</a></p>'
                + '<p>Нажмите на ссылку правой кнопкой мыши и в меню выберите "Копировать адрес ссылки"</p>'
                + '<p>Для просмотра результатов клиенту <strong>не нужен</strong> аккаунт на нашем сайте.</p>'
                + '<p>Чтобы закрыть клиенту доступ к результатам, нажмите кнопку "Сменить ссылку"</p>',
            function(){
                $('#genericModal').modal('hide');
            },
            // change link
            function(){
                $('#genericModal').modal('hide');
                $.get(
                    '/public/php/regular_change_client_link.php?project_id=' + project_id + '&hash=' + Math.random()
                ).success(function(data){
                    if (data.trim() == '') {
                        show_error('<p>Возникла ошибка при смене клиентской ссылке.</p>');
                    } else {
                        $('.dotted_link.regular_filter.is_active').data('client_link', data);
                        show_message(
                            'Ссылка для клиента обновлена', 
                            '<p>Новая ссылка для клиента:</p><p align="center"><input readonly type="text" value="https://content-watch.ru/regular/client/' + data + '/" class="client_link"/></p>'
                            );
                    }
                }).fail(function(data){
                    show_error('<p>Возникла ошибка при смене клиентской ссылке.</p>');
                });
            }, 'Ок', 'Сменить ссылку'
        );
        $('.client_link').select();
    });
    
    // csv export link click event
    $urlsList.on('click', 'a.exportcsv', function(){
        $('iframe').remove();
        $body.append( $('<iframe></iframe>').hide().attr('src', 'https://content-watch.ru/public/php/regular_get_pages.php?hash=' + Math.random() + '&code=' + $(this).data('code') + '&export=csv') );
        return false;
    });
    
    if (!IS_CLIENT) {
        $urlsList.hide();
        $('.regular_filter[data-what="non-unique"]').click();
        $(window).hashchange( function(){
            filter_based_on_hash();
        });
    }

    // manual re-queue
    $urlsList.on('click', 'a.check-regular-manual', function(){
        var $element = $(this);
        $.get(
            '/public/php/regular_manually_queue.php?url_id=' + $(this).data('url-id') + '&hash=' + Math.random()
        ).success(function(data){
            var response = data.trim();
            if (response === '200') {
                show_message(
                    'Проверка запущена',
                    '<p>Страница добавлена в очередь и будет перепроверена в ближайшее время</p>'
                );
                $element.off('click').find('img').attr('src', '/img/loader-circle.gif');
            } else if (response.match(/^\d+$/)) {
                show_error(error_code(response, 'regular_manual_queue'));
            }
        }).fail(function(data){
            show_error(error_code('0', 'regular_manual_queue'));
        });
        return false;
    });
});

// get pages based on filter
function get_pages(code, page){
    $.get(
        '/public/php/regular_get_pages.php?hash=' + Math.random() + '&code=' + code + '&page=' + page
    ).success(function(data){

        var result = $.parseJSON(data);
        if (typeof result.amounts == 'undefined') {
            $('#regular_urls_list').html('<p style="color: red;">Произошла ошибка. Пожалуйста, <a href="/regular/">обновите</a> страницу.</p>');
            show_error('<p>Произошла ошибка. Пожалуйста, <a href="/regular/">обновите</a> страницу.</p>');
            return;
        }

        if (result.amounts) {
            refresh_amounts(result.amounts);
        }

        if (result.urls.length < 1) {
            $('#regular_urls_list').html('<h3>' + result.title + '</h3><p>В данной категории нет страниц</p>');
            return;
        }

        if (KEEP_LIST_HIDDEN_ONCE) {
            KEEP_LIST_HIDDEN_ONCE = false;
            setTimeout(function(){ $('#regular_urls_list').show(); }, 1000);
        } else {
            $('#regular_urls_list').show();
        }

        // tpl header
        var source   = $("#regular_urls_js_tpl").html();
        var template = Handlebars.compile(source);
        $('#regular_urls_list').html(template(result));

        // pagers
        if (result.urls.length > URLS_PER_PAGE) {
            var pages = Math.ceil(result.urls.length / URLS_PER_PAGE);
            for (var p = 1; p <= pages; p++) {
                var $append = $(' <a/> ').data('page', p).addClass('btn nocaps btn-sm btn-outline btn-default regular-page').text(p);
                if (p == 1) {
                    $append.addClass('btn-primary').removeClass('btn-outline btn-default');
                }
                $('.regular-pagination').append($append).append(' ');
            }
            $('span.pager.pager_active').click();
        }

        // client report link
        if (code.match(/^\d+$/)) {
            var $append = $(' <a/> ').attr('href', 'javascript:;').data('project_id', code)
                .addClass('btn nocaps btn-sm btn-outline btn-default report')
                .append($('<span/>').addClass('glyphicon glyphicon-link')).append(' Отчет для клиента');
            $('.regular-pagination').append($append).append(' ');
        }

        // csv export link
        if (result.urls.length > 0) {
            var $append = $(' <a/> ').attr('href', 'javascript:;').data('code', code)
                .addClass('btn nocaps btn-sm btn-outline btn-default exportcsv')
                .append($('<span/>').addClass('glyphicon glyphicon-download-alt')).append(' Экспорт в CSV');
            $('.regular-pagination').append($append).append(' ');
        }
    });
}

function pages_action(action, pages, func){
    $.get(
        '/public/php/regular_pages_action.php?action=' + action + '&hash=' + Math.random() + '&pages=' + pages
    ).success(function(data){

        var result = $.parseJSON(data);
        if (result.error.length > 0) {
            show_error(result.error);
            return;
        } else {
            $('.action_boxes input:checked').prop('checked', false);
            $('a.regular_filter.is_active').click();
        }

        $('#pages_not_paid').text(result.pages_not_paid);
        if (parseInt(result.pages_not_paid) > 0) {
            $('#over_the_limit').show();
        } else {
            $('#over_the_limit').hide();
        }

        if (typeof 'func' != 'undefined') {
            func(result);
        }

        return data;
    });
}

function refresh_amounts(amounts){
    for (var id in amounts)
    {
        if (amounts.hasOwnProperty(id)) {
            switch (id)
            {
                case 'non-unique':
                    $('#problem_pages').text( amounts[id][1] );
                    break;
                case 'all':
                    $('#total_pages').text( amounts[id][1] );
                    break;
                case 'not-paid':
                    $('#not-paid_pages').text( amounts[id][1] );
                    break;
                case 'active':
                    $('#active_pages').text( amounts[id][1] );
                    break;
                case 'with-errors':
                    $('#with-errors').text( amounts[id][1] );
                    break;
                case 'archived':
                    $('#archived_pages').text( amounts[id][1] );
                    break;
                default:
                    if ($('#project_' + id).length > 0) {
                        $('#project_' + id).text( amounts[id][1] );
                    } else {
                        $('.domen_list').append(
                            $('<a></a>').addClass('dotted_link').addClass('regular_filter')
                                .attr('href', 'javascript:;').data('what', id)
                                .data('client_link', amounts[id][2]).html(
                                amounts[id][0] + ' (<span id="project_' + id + '">'
                                + amounts[id][1] +  '</span>)'
                            )
                        );
                    }
            }
        }
    }
    if (FIRST_CLICK) {
        FIRST_CLICK = false;
        if (location.hash != '') {
            KEEP_LIST_HIDDEN_ONCE = true;
            filter_based_on_hash();
        } else if ($('#problem_pages').text() == '0') {
            KEEP_LIST_HIDDEN_ONCE = true;
            if ($('#active_pages').text() == '0') {
                $('.regular_filter[data-what="not-paid"]').click();
            } else {
                $('.regular_filter[data-what="active"]').click();
            }
        }
    }
    if ($('#not-paid_pages').text() == '0') {
        $('#not-paid_pages').parent().hide();
    } else {
        $('#not-paid_pages').parent().show();
    }
    if ($('#archived_pages').text() == '0') {
        $('#archived_pages').parent().hide();
    } else {
        $('#archived_pages').parent().show();
    }
    if ($('#with-errors').text() == '0') {
        $('#with-errors').parent().hide();
    } else {
        $('#with-errors').parent().show();
    }
}

function filter_based_on_hash() {
    var hash = location.hash;
    var project = 0;
    if (hash.indexOf('prj/') >= 0) {
        project = hash.split('/')[1];
        hash = '#prj';
    }
    
    switch (hash) {
        case '#prj':
            // get_pages(project);
            $('span#project_' + project).closest('a').click();
            break;
        case '#listerr':
            $('.regular_filter[data-what="with-errors"]').click();
            break;
        default:
    }
}
