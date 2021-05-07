
$(function(){
    $('#action2').prop('checked', true);
    DISABLER = false;
    
    type = null;
    checker = false;
    progressTimeout = false;
    count = 50;
    die_after = 70;
    // MotionMaker = new MotionMaker();
    active_req = false;
    
    reset_progress();
    
    $('.check-btn:not(.check-selected-sections) div a').click(function(){
        $('#forma2').submit();
    });
    $('#page, #site').on('keydown', function(event){
        if (event.which == 13) {
            $('#forma2').submit();
        }
    });
});

function check_url_error(id, error)
{
    $('#uniqimg'+id).css('background', "#fff url(/img/fail.png) no-repeat center center");
    $('#uniqlink'+id).remove();
    $('#uniq'+id).attr('colspan', 2);
    $('#uniq'+id).html(error);
    check_url(id+1);
}

function check_url_awaiting(id, hash)
{
    $.get(
        '/public/php/checker_result.php?check=url&hash=' + hash + '&r=' + Math.random(), 'json'
    )
    .fail(function() {
        count = count - 1;
        if (count > 0) {
            setTimeout(function(){ check_url_awaiting(id, hash); }, 2000);
        } else {
            check_url_error(id, '<strong>Сервис временно недоступен</strong>');
        }
    })
    .done(function(data) {
        var resp = $.parseJSON(data);
        if (typeof resp.error != 'undefined' && parseInt(resp.error) > 0) {
            if (resp.error == '407') {
                setTimeout(function(){ check_url_awaiting(id, hash); }, 2000);
                return;
            }
            check_url_error(id, '<b>' + error_code(resp.error, 'website_set') + '</b>');
            return;
        }

        $('#uniq'+id).addClass(resp.global['class']);
        $('#uniq'+id).html(resp.global['uniq'] + '%');
        $('#uniqimg'+id).css('background', "#fff url(/img/ok.png) no-repeat center center");
        if (resp.result.length > 0) {
            $('#uniqlink'+id).html('<a href="javascript:;" onclick="show_details(' + id + ');return false;">показать детали</a>');

            var source   = $("#check_url_result").html();
            var template = Handlebars.compile(source);

            $('#tempholder').append(
                '<div id="text_' + id + '">' + decodeURI(resp.global['text']) + '</div>'
                + '<input type="hidden" id="hl_words_global_' + id + '" value="' + resp.global['hl'] + '">'
                + '<div id="holder_' + id + '">' + template(resp) + '</div>'
            );
        }
        check_url(id+1);
    });
}

function check_url(id)
{
    if (id >= parseInt($('#urls_total').val())) {
        if ($('#holder').html() == '') {
            $('#newcheck1').show();
        }
        return false;
    }
    $('#uniqimg'+id).css('background', "#fff url(/img/loader2.gif) no-repeat center center");
    var url = $('#url'+id).attr('href');

    $.get(
        '/public/php/checker_start.php?r=' + Math.random(), 'json'
    )
    .fail(function() {
        check_url_error(id, '<strong>Сервис временно недоступен</strong>');
    })
    .done(function(data) {
        var resp = $.parseJSON(data);
        type = resp.type;
        $.post(
            '/public/php/check_url.php?r=' + Math.random(),
            {
                'url': encodeURIComponent(url),
                'code': eval(resp.code)
            }, 'json'
        )
        .fail(function () {
            check_url_error(id, '<strong>Сервис временно недоступен</strong>');
        })
        .done(function (data) {
            var resp = $.parseJSON(data);
            if (parseInt(resp.error) > 0) {
                check_url_error(id, '<b>' + error_code(resp.error, 'website_set') + '</b>');
                return;
            }
            count = 20;
            setTimeout(function(){ check_url_awaiting(id, resp.hash); }, 10000);
        });
    });
}

function check_single()
{
    var page = $('#page').val();
    if (page.length < 5 || page.indexOf('.') < 1) {
        show_error('Необходимо указать полный адрес страницы для проверки.');
        $('#page').focus();
        return false;
    }
    $('#hiddo').css('width', '100%');
    $('#hiddo').css('height', '40px');
    $('#hiddo').show();
    DISABLER = true;

    $('#holder').html('');
    $('.check-btn').hide();
    $('.single-url-loader').show();
    clearTimeout(checker);
    reset_progress();
    progress(0);

    $.get(
        '/public/php/checker_start.php?r=' + Math.random(), 'json'
    )
    .fail(function() {
        clearTimeout(progressTimeout);
        show_error('Сервис временно недоступен');
        unblock_elements('web2');
        $('#holder').html('');
        $('#hiddo').hide();
        $('#link').show();
        $('.single-url-loader').hide();
        $('.check-btn').show();
        DISABLER = false;
    })
    .done(function(data) {
        var resp = $.parseJSON(data);
        $('#barlh').val(0);

        $.post(
            '/public/php/check_url.php?r=' + Math.random(),
            {
                'url': encodeURIComponent(page),
                'code': eval(resp.code)
            }, 'json'
        )
        .fail(function() {
            clearTimeout(progressTimeout);
            show_error('Сервис временно недоступен');
            unblock_elements('web2');
            $('#holder').html('');
            $('#hiddo').hide();
            $('#link').show();
            $('.single-url-loader').hide();
            $('.check-btn').show();
            DISABLER = false;
        })
        .done(function(data) {

            var resp = $.parseJSON(data);
            if (parseInt(resp.error) > 0) {
                $('#holder').html('');
                $('#hiddo').hide();
                $('#link').show();
                DISABLER = false;
                show_error(error_code(resp.error, 'website_single'));
                clearTimeout(progressTimeout);
                $('.single-url-loader').hide();
                $('.check-btn').show();
                return;
            }

            current_check_hash = resp.hash;
            checker = setTimeout("callChecker()", 1000);
        });
    });
}

function getResults()
{
    clearTimeout(checker);

    $.get(
        '/public/php/checker_result.php?check=url&hash=' + current_check_hash + '&r=' + Math.random(), 'json'
    )
    .fail(function() {
        count = count - 1;
        if (count > 0) {
            checker = setTimeout("getResults()", 4000);
        }
    })
    .done(function(data) {
        clearTimeout(checker);
        var resp = $.parseJSON(data);

        if (typeof resp.error != 'undefined' && parseInt(resp.error) > 0) {
            show_error(error_code(resp.error, 'website'));
            return;
        }

        $('#text_hl').html( decodeURI(resp.global['text']) );
        $('#text').html( $('#text_hl').html() );

        if (resp.global['hl'].length > 1) {
            hl_words( resp.global['hl'] );
        }
        $('.single-url-loader').hide();

        var source   = $("#check_url_result").html();
        var template = Handlebars.compile(source);
        $('#holder').html(template(resp));
        process_legal_statuses('#holder');
        $("#holder").find('.hover-tooltip').popover({trigger: 'hover'});

        $('#text').hide();
        $('#text_hl').show();
    });
}

function callChecker()
{
    count = count - 1;
    if (count > 0) {
        checker = setTimeout("callChecker()", 6000);
    }
    if (active_req) {
        return false;
    }

    active_req = true;
    $.get(
        '/public/php/checker_progress.php?check=url&hash=' + current_check_hash + '&r=' + Math.random(), 'json'
    )
    .always(function() {
        active_req = false;
    })
    .done(function(data) {
        var resp = $.parseJSON(data);
        if (parseInt(resp.progress) > 0) {
            var target = benchmarkToWidth(parseInt(resp.progress));
            progress(target);
        }
        if ($('#barlh').val() == resp.progress) {
            die_after = die_after - 1;
            if (die_after <= 0) {
                clearTimeout(checker);
            }
        } else {
            die_after = 70;
        }
        $('#barlh').val(resp.progress);
    });
}

function progressOnTimeout() {
    clearTimeout(progressTimeout);

    // no changes since last run
    if (progress_current >= progress_max) {
        progressTimeout = setTimeout(function(){ progressOnTimeout(); }, 2000);
        return;
    }

    // last change of stage was too close, wait for the next
    var time_passed = Date.now() - progress_last_date;
    if (time_passed < 2000) {
        progressTimeout = setTimeout(function(){ progressOnTimeout(); }, 2500 - time_passed);
        return;
    }

    // progressing one stage
    progress_last_date = Date.now();
    progress_current++;
    if (progress_current >= 0) {
        for (var i = 0; i < 3; i++) {
            var src = i == progress_current ? '/img/loader3.gif' : (i < progress_current ? '/public/images/right.png' : '/img/bg_hider.png');
            if ($('div.single-url-loader div:eq(' + i + ') img').attr('src') != src) {
                $('div.single-url-loader div:eq(' + i + ') img').attr('src', src);
            }
        }
    }

    // if we have not reached last stage, repeat
    if (progress_current < 3) {
        progressTimeout = setTimeout(function(){ progressOnTimeout(); }, 2000);

    // if we reached last stage, query results
    } else {
        setTimeout("getResults()", 500);
    }
}

function progress(target) {
    if (target > progress_max) {
        progress_max = target;
    }
    if (target == 0) {
        progressTimeout = setTimeout(function(){ progressOnTimeout(); }, 2000);
    }
}

function reset_progress() {
    progress_max = -1;
    progress_current = -1;
    progress_last_date = 0;
    progress_active = false;
    progress_functions = [];
}
function benchmarkToWidth(bm) {
    if (bm >= 500) {
        clearTimeout(checker);
        return 3;
    }
    if (bm >= 250) {
        return 2;
    }
    if (bm > 200) {
        return 2;
    }
    if (bm >= 150) {
        return 1;
    }
    if (bm >= 100) {
        return 1;
    }
    return 1;
}

function get_action() 
{
    switch (parseInt($('#action').val())) {
        case 2:
            start_scanner();
            break;
        case 3:
            check_batch_list();
            break;
        default:
            check_single();
            break;
    }
}

function show_block(block) 
{
    if (DISABLER) {
        return false;
    }
    $('#holder').html('');
    $('#block1').hide();
    $('#block2').hide();
    $('#block3').hide();
    $('#block'+block).show();
    $('#action').val(block);
    $('#action'+block).prop('checked', true);
    $('#link').attr('src', (block != '2') ? '/img/button.png' : '/img/button2.png');
}
