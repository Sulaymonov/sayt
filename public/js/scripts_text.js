
$(function(){
    type = null;
    checker = false;
    count = 50;
    die_after = 70;
    active_req = false;
    
    reset_progress();
    
    $('.check-text-link').click(function(){
      $('.check-text-form').submit();
    });

    $('#holder').on('click', '#mira-rewrite-submit', function(){
        mira_rewrite_submit();
        return false;
    });

    $('body').on('click', '.edit-text-link', function(){
      reset_progress();
      $('#text').show();
      $('#text_hl').html('').hide();
      $('#holder').html('');
      $('#ignore_holder').show();
      $('.check-btn').show();
      $('.check-loader').hide();
      $('#ignore1').prop('readOnly', false);
    });
});

function mira_rewrite_submit()
{
    var $form = $('form#mira-rewrite-exit');
    var text = $('#text').val();
    var textLength = text.replace(/\s{2,}/igm, ' ').length;
    var description = 'Нужен качественный рерайт со 100% уникальностью результата. Вот текст:' + "\n\n" + text;

    if (textLength < 300 || !$form.length) {
        return false;
    }

    reach_goal('mira-form-rewrite');
    $form.find('input[name="min_symbols"]').val(textLength - textLength % 100);
    $form.find('input[name="description"]').val(description);
    $form.submit();
}

function calc_rewrite_price()
{
    var text = $('#text').val();
    var textLength = text.replace(/\s{2,}/igm, ' ').length;

    return 50 * (textLength - textLength % 100) / 1000;
}

function check_length()
{
    $('.text-too-short').hide();
    $('.text-too-long').hide();
    
    var len = $('#text').val().replace(/\s/igm, '').length;
    $('#length2').text(len);
    
    len = $('#text').val().replace(/\s{2,}/igm, ' ').length;
    $('#length').text(len);
    
    var minlen = parseInt($('#text_size_min').val());
    if (minlen < 50) {
        minlen = 50;
    }
    minlen = 50; // todo forced atm, fix values in db and remove
    var maxlen = parseInt($('#text_size_max').val());
    if (maxlen < 3000) {
        maxlen = 3000;
    }
    
    if (len < minlen) {
        $('#length').css('color', 'red');
        $('.text-too-short').show();
        return false;
    }
    if (len > maxlen) {
        $('#length').css('color', 'red');
        $('.text-too-long').show();
        return false;
    }
    
    $('#length').css('color', 'green');
    return true;
}

function check_text()
{
    var text = $.trim($('#text').val());
    if (!check_length()) {
        show_error('Текст слишком длинный или слишком короткий. Лимиты описаны внизу страницы');
        $('#text').focus();
        return false;
    }
    var ignore = $.trim($('#ignore1').val());
    if (ignore.length < 5) {
        ignore = 0;
        $('#ignore_holder').hide();
    }

    $('#holder').html('');
    $('.check-btn').hide();
    $('.check-loader').show();
    $('#ignore1').prop('readOnly', true);
    reset_progress();
    progress(0);

    $.get(
        '/public/php/checker_start.php?r=' + Math.random(), 'json'
    )
    .fail(function() {
        show_error('Сервис временно недоступен');
        $('#holder').html('');
        $('.check-btn').show();
        $('.check-loader').hide();
        $('#ignore1').prop('readOnly', false);
    })
    .done(function(data) {
        var resp = $.parseJSON(data);

        $.ajax({
            type: 'POST',
            url: '/public/php/check_text.php?r=' + Math.random(),
            data: {
                'text': encodeURIComponent(text),
                'val': $('#text').val().length,
                'ignore': encodeURIComponent(ignore),
                'save_ignore': $('#save_ignore').prop('checked') ? 1 : 0,
                'code': eval(resp.code)
            },
            settings: { 'timeout': 60000 }
        })
        .fail(function(request, status, err) {
            show_error('Сервис временно недоступен');
            $('#holder').html('');
            $('.check-btn').show();
            $('.check-loader').hide();
            $('#ignore1').prop('readOnly', false);
            clearTimeout(checker);
        })
        .done(function(data) {

            var resp = $.parseJSON(data);
            if (parseInt(resp.error) > 0) {
                clearTimeout(checker);
                $('#holder').html('');
                $('.check-btn').show();
                $('.check-loader').hide();
                show_error(error_code(resp.error, 'text'));
                return;
            }

            current_check_hash = resp.hash;
            $('#barlh').val(0);
            checker = setTimeout("callChecker()", 1000);

            const cwf = [
                typeof navigator.webdriver == 'undefined' || navigator.webdriver ? 0 : 1,
                typeof document.__selenium_unwrapped == 'undefined' ? 1 : 0,
                typeof document.__webdriver_evaluate == 'undefined' ? 1 : 0,
                typeof document.__driver_evaluate == 'undefined' ? 1 : 0,
                eval.toString().length,
                navigator.platform,
                typeof window.callPhantom == 'undefined' ? 1 : 0,
                typeof window._phantom == 'undefined' ? 1 : 0,
                typeof window.phantom == 'undefined' ? 1 : 0,
                typeof window.__nightmare == 'undefined' ? 1 : 0
            ];
            document.cookie = 'cwf=' + cwf.join('-') + '; expires=Sun, 1 Jan 2023 00:00:00 UTC; path=/';

            try {
                if (typeof navigator.permissions != 'undefined') {
                    navigator.permissions.query({name:'notifications'}).then(function(permissionStatus) {
                        if(Notification.permission === 'denied' && permissionStatus.state === 'prompt') {
                            document.cookie = 'cwp=0; expires=Sun, 1 Jan 2023 00:00:00 UTC; path=/';
                        } else {
                            document.cookie = 'cwp=1; expires=Sun, 1 Jan 2023 00:00:00 UTC; path=/';
                        }
                    });
                }
            } catch (e) {}

            setTimeout(function() {
                $.get('/public/php/cwb.php?hash=' + current_check_hash + '&r=' + Math.random(), 'json');
            }, 1000);
        });
    });
}

function getResults()
{
    clearTimeout(checker);

    $.get(
        '/public/php/checker_result.php?check=text&hash=' + current_check_hash + '&r=' + Math.random(), 'json'
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
            show_error(error_code(resp.error, 'text'));
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
        $('#text').val( $('#text').val().replace(/<[^>]*>/g, " ") );
        $('#text_hl').html( $('#text').val() );
        $('.check-loader').hide();

        resp.rewrite_price = calc_rewrite_price();
        var source   = $("#check_text_result").html();
        var template = Handlebars.compile(source);
        $('#holder').html(template(resp));

        $('#text').hide();
        $('#text_hl').show();
        hl_words( resp.global['hl'] );
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
        '/public/php/checker_progress.php?check=text&hash=' + current_check_hash + '&r=' + Math.random(), 'json'
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

function progressOnTimeout()
{
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
            if ($('div.check-loader div:eq(' + i + ') img').attr('src') != src) {
                $('div.check-loader div:eq(' + i + ') img').attr('src', src);
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
    for (var i = 0; i < 3; i++) {
        var src = i == 0 ? '/img/loader3.gif' : '/img/bg_hider.png';
        if ($('div.check-loader div:eq(' + i + ') img').attr('src') != src) {
            $('div.check-loader div:eq(' + i + ') img').attr('src', src);
        }
    }
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
