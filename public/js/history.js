
function refresh_history() {
    get_history($('.history_type.btn-primary').data('what'), $('.history_filter.btn-primary').data('what'));
}

function get_history(type, datefilter, exporting) {
    $('#history_urls_list').html('<br/><br/><div style="text-align: center;"><img src="/img/loader3.gif"/></div>');
    var page = 1;
    if (typeof exporting == 'undefined') {
        var exporting = '';
    }
    $.get(
        '/public/php/get_history.php?hash=' + Math.random() + '&type=' + type + '&datefilter=' + datefilter + '&page=' + page + '&exporting=' + exporting
    ).success(function(data){
        $('#history_urls_list').html('');
        $('#checkshistory').html('');
        var result = $.parseJSON(data);
        if (typeof result.urls == 'undefined') {
            $('#checkshistory').html('<p style="color: red;">Произошла ошибка. Пожалуйста, <a href="/cabinet/history/">обновите</a> страницу.</p>');
            show_error('<p>Произошла ошибка. Пожалуйста, <a href="/cabinet/history/">обновите</a> страницу.</p>');
            return;
        }

        if (result.urls.length) {
            //paginate_history(result.history.length);
        }

        if (result.urls.length < 1) {
            $('#checkshistory').html('<p>В вашей истории нет записей</p>');
            return;
        }
        var source   = $("#history_urls_js_tpl").html();
        var template = Handlebars.compile(source);
        $('#history_urls_list').html(template(result));
    });
}

function process_history_click(name, $this) {
    $('a.' + name).removeClass('btn-primary').removeClass('btn-outline').removeClass('btn-default');
    var current_what = $this.data('what');
    $('a.' + name).each(function(){
        if ($(this).data('what') == current_what) {
            $(this).addClass('btn-primary');
        } else {
            $(this).addClass('btn-outline').addClass('btn-default');
        }
    });
    refresh_history();
    return false;
}

function get_batch_history_handelbars(batch_hash)
{
    $('#history_urls_list').html('<br/><br/><div style="text-align: center;"><img src="/img/loader3.gif"/></div>');
    var page = 1;
    if (typeof exporting == 'undefined') {
        var exporting = '';
    }
    $.get(
        '/public/php/get_history_batch.php?m=' + Math.random() + '&batch_hash=' + batch_hash + '&page=' + page + '&exporting=' + exporting
    ).success(function(data){
        $('#history_urls_list').html('');
        var result = $.parseJSON(data);
        if (typeof result.urls == 'undefined') {
            $('#checkshistory').html('<p style="color: red;">Произошла ошибка. Пожалуйста, <a href="/cabinet/history/">обновите</a> страницу.</p>');
            show_error('<p>Произошла ошибка. Пожалуйста, <a href="/cabinet/history/">обновите</a> страницу.</p>');
            return;
        }

        if (result.urls.length < 1) {
            $('#checkshistory').html('<p>В вашей истории нет записей</p>');
            return;
        }
        var source   = $("#history_urls_js_tpl").html();
        var template = Handlebars.compile(source);
        $('#history_urls_list').html(template(result));
        if (result.repeat_request) {
            setTimeout(function(){ get_batch_history_handelbars(batch_hash); }, 15000);
        }
    });
}

function getResultsHistory(history_type)
{
    $.get(
        '/public/php/checker_result.php?check=' + history_type.toLowerCase() + '&hash=' + current_check_hash + '&r=' + Math.random(), 'json'
    )
    .fail(function() {
        count = count - 1;
        if (count > 0) {
            checker = setTimeout("getResults()", 4000);
        }
    })
    .done(function(data) {
        $('.history-page-loader').hide();
        $('.history-page-content').show();
        var resp = $.parseJSON(data);

        if (typeof resp.error != 'undefined' && parseInt(resp.error) > 0) {
            $('#holder').html(
                '<h4 class="text-danger">Проверка завершилась с ошибкой</h4>'
                + '<p>' + error_code(resp.error, 'history') + '</p>'
            );
            return;
        }

        var i = 0;
        while ($('#text').val().match(/\s[^a-zA-Zа-яА-Я0-9ІіЇїЙйЁё]+\s/)) {
            $('#text').val(
                $('#text').val().replace(/\s[^a-zA-Zа-яА-Я0-9ІіЇїЙйЁё]+\s/, " ")
            );
            if (++i > 50) {
                break;
            }
        }
        $('#text').val( $('#text').val().replace(/<br\s*\/?\s*>/, " ") );
        $('#text').val( $('#text').val().replace(/<[^>]*>/, " ") );
        $('#text_hl').html( $('#text').val() );

        var templatePath = history_type == 'text' ? '#check_text_result' : '#check_url_result';
        var source = $(templatePath).html();
        var template = Handlebars.compile(source);
        $('#holder').html(template(resp));
        process_legal_statuses('#holder');
        $("#holder").find('.hover-tooltip').popover({trigger: 'hover'});

        $('.check-loader').hide();
        $('#text').hide();
        $('#text_hl').show();
        hl_words( resp.global['hl'] );
    });
}
