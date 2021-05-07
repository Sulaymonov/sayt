
$(function(){
    ACTIVE_REQUEST = false;
    SCANNER_REQUESTS = 0;

    // check selected pages
    $('#block2').on('click', '.check-selected-sections', function(event){
        processBatch(get_selected_checkbox_values());
    });

    // check one section
    $('#block2').on('click', '.check-one-section', function(event){
        if (ACTIVE_REQUEST) {
            return false;
        }
        var sections = [$(this).closest('tr').find('input').val()];
        processBatch(sections);
    });

    // select pages of one section
    $('#block2').on('click', '.pick-pages-of-section', function(event){
        if (ACTIVE_REQUEST) {
            return false;
        }
        var sections = [$(this).closest('tr').find('input').val()];
        fillBatchWithUrls(sections, function(){
            DISABLER = false;
            $('.batch-check-btn').show();
            $('.batch-waiting-redirect').hide();
            show_block(3);
        });
    });

    // select pages' checkboxes
    $('.get-urls-list').on('click', '.action_boxes', function(event){

        // if cell is clicked, changing checkbox value
        if (event.target.nodeName != 'INPUT') {
            $(this).find('input').prop('checked', !$(this).find('input').prop('checked') );
        }
        if ($('.action_boxes input:checked').length > 0) {
            $('.action-select').val(0);
            $('.action-block').css('display', 'inline-block');
            $('.check-selected-sections').show();
            $('a.action-block-select-all').text('снять выделение').data('flag', true);
        } else {
            $('.action-block').css('display', 'none');
            $('.check-selected-sections').hide();
            $('a.action-block-select-all').text('выделить все').data('flag', false);
        }
    });

    // select all pages
    $('.get-urls-list').on('click', 'a.action-block-select-all', function(){
        if ($(this).data('flag') == true) {
            $('.action_boxes input').prop('checked', false);
            $(this).data('flag', false);
            $('a.action-block-select-all').text('выделить все');
            $('.action-block').css('display', 'none');
            $('.check-selected-sections').hide();
        } else {
            $('.action_boxes input').prop('checked', true);
            $(this).data('flag', true);
            $('a.action-block-select-all').text('снять выделение');
            $('.action-block').css('display', 'inline-block');
            $('.check-selected-sections').show();
        }
    });

    $('.secondary-search-button').click(function(){
        if (ACTIVE_REQUEST) {
            return false;
        }
        $('#forma2').submit();
    })
});

function get_selected_checkbox_values()
{
    if ($('.action_boxes input:checked').length < 1) {
        $('.action-select').val(0);
        return;
    }
    var added = 0;
    var values = [];
    $('.action_boxes input:checked').each(function(){
        values.push( $(this).val() );
        added++;
    });
    return values;
}

function get_sections_scanner()
{
    var url = $('#site').data('last-scanned') || $.trim($('#site').val());
    if (url.length < 5 || url.indexOf('.') < 1) {
        show_error('Укажите, пожалуйста, адрес сайта');
        $('#site').focus();
        return false;
    }

    ACTIVE_REQUEST = true;
    SCANNER_REQUESTS++;
    
    $.get(
        '/public/php/start.php?action=3&hash=' + Math.random(), 'json'
    )
    .fail(function() {
        $('.get-urls-loader').hide();
        show_error('Сервис временно недоступен');
        ACTIVE_REQUEST = false;
        $('#hiddo').hide();
    })
    .done(function(data) {
        var resp = $.parseJSON(data);
        
        $.post(
            '/public/php/scanner_get_sections.php?hash=' + Math.random(),
            { 'url': encodeURIComponent(url), 'type': resp.type, 'code': eval(resp.code) }, 'json'
        )
        .always(function() {
            ACTIVE_REQUEST = false;
        })
        .fail(function() {
            show_error('Сервис временно недоступен');
        })
        .done(function(data) {
            var resp = $.parseJSON(data);
            if (parseInt(resp.error) > 0) {
                show_error(error_code(resp.error, 'website_geturls'));
                return;
            }

            var source   = $("#urls_list_js_tpl").html();
            var template = Handlebars.compile(source);
            $('.get-urls-list').html(template(resp))

            // scanning done
            if (parseInt(resp.progress) == 100 || parseInt(resp.scanning) == 0 || SCANNER_REQUESTS >= 20) {
                $('#holder').html('');
                $('.get-urls-loader').hide();
                DISABLER = false;
                $('#hiddo').hide();
                $('.secondary-search-button').removeClass('hidden');

                if (parseInt(resp.progress) < 100) {
                    $('.scan-results strong:eq(0)').text(resp.progress + '%');
                    $('.scan-results strong:eq(1)').text(resp.total);
                    $('.scan-results').removeClass('hidden');
                }
            } else {
                $('.get-urls-loader strong').text(resp.progress + '%');
                setTimeout(function () { get_sections_scanner(); }, 4000);
            }
        });
    });
    $('.get-pages-links').hide();
    $('.check-website-link').show();
}

function start_scanner()
{
    var url = $.trim($('#site').val());
    $('#site').data('last-scanned', url);
    if (url.length < 5 || url.indexOf('.') < 1) {
        show_error('Укажите, пожалуйста, адрес сайта');
        $('#site').focus();
        return false;
    }

    $('#hiddo').css('width', '100%');
    $('#hiddo').css('height', '40px');
    $('#hiddo').show();
    DISABLER = true;
    ACTIVE_REQUEST = true;
    SCANNER_REQUESTS = 0;
    $('#holder').html('');
    $('#link').hide();
    $('.get-urls-list').html('');
    $('.get-urls-cta-holder, .get-urls-holder').hide();
    $('.get-urls-loader').show();
    $('.get-urls-loader strong').html('&nbsp;&nbsp;');
    $('.scan-results').removeClass('hidden').addClass('hidden');

    $.get(
        '/public/php/start.php?action=3&hash=' + Math.random(), 'json'
    )
    .fail(function() {
        $('#holder').html('');
        $('.get-urls-loader').hide();
        show_error('Сервис временно недоступен');
        ACTIVE_REQUEST = false;
        $('#hiddo').hide();
    })
    .done(function(data) {
        var resp = $.parseJSON(data);

        $.ajax({
            type: 'POST',
            url: '/public/php/scanner_start.php?hash=' + Math.random(),
            data: {
                'url': encodeURIComponent(url),
                'type': resp.type,
                'code': eval(resp.code)
            },
            settings: { 'timeout': 60000 }
        })
        .always(function() {
            ACTIVE_REQUEST = false;
        })
        .fail(function() {
            show_error('Сервис временно недоступен');
        })
        .done(function(data) {
            var resp = $.parseJSON(data);
            if (parseInt(resp.error) > 0) {
                show_error(error_code(resp.error, 'website_geturls'));
                return;
            }

            setTimeout(function(){ get_sections_scanner(); }, 10000);
        });
    });
    $('.get-pages-links').hide();
    $('.check-website-link').show();
}

function fillBatchWithUrls(sections, callable)
{
    $('.batch-check-btn').hide();
    $('.check-selected-sections').hide();
    $('.batch-waiting-redirect').show();
    var url = $('#site').data('last-scanned') || $.trim($('#site').val());
    if (url.length < 5 || url.indexOf('.') < 1) {
        show_error('Не переданы адреса страниц');
        return false;
    }

    ACTIVE_REQUEST = true;
    $.get(
        '/public/php/start.php?action=3&hash=' + Math.random(), 'json'
    )
    .fail(function() {
        show_error('Не переданы адреса страниц');
        $('.batch-waiting-redirect').hide();
        ACTIVE_REQUEST = false;
        return false;
    })
    .done(function(data) {
        var resp = $.parseJSON(data);

        $.post(
            '/public/php/scanner_get_urls.php?hash=' + Math.random(),
            { 'url': encodeURIComponent(url), 'sections': sections, 'type': resp.type, 'code': eval(resp.code) }, 'json'
        )
        .fail(function() {
            show_error('Не переданы адреса страниц');
            $('.batch-waiting-redirect').hide();
            ACTIVE_REQUEST = false;
            return false;
        })
        .done(function(data) {
            ACTIVE_REQUEST = false;
            var resp = $.parseJSON(data);
            if (parseInt(resp.error) > 0) {
                show_error('Ошибка передачи адресов страниц');
                $('.batch-waiting-redirect').hide();
                return;
            }

            $('#set_pages').val(resp.urls.join("\n"));
            callable();
        });
    });
}

function processBatch(sections)
{
    fillBatchWithUrls(sections, function(){
        // onBatchEvent must be defined in a separate file, depending on required functionality
        onBatchEvent();
    });
}


