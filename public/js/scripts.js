
LANG = 'ru';
ONQUICKLOGINREGISTER = function() {};

$(function(){

    bindPaymentHandler('body');

    $('.btn-choose-duration').click(function(e){
        e.preventDefault();
        showChooseDurationPopup($(this).data('tarif-config'));
        return false;
    });

    $('.voucher-activate-button').click(function(e){
        e.preventDefault();
        activate_voucher($('.voucher-input').val());
        return false;
    });

    $('.voucher-input').keydown(function(event){
        if (event.keyCode == 13) {
            activate_voucher($('.voucher-input').val());
            return false;
        }
    });

    $('.trial-button').click(function(e){
        e.preventDefault();
        activate_voucher('trial');
        return false;
    });

    $('a.track-click').click(function(){
        reach_goal($(this).data('goal'));
    });

    $('#holder').on('click', 'a.track-click', function(){
        reach_goal($(this).data('goal'));
    });
});

function showChooseDurationPopup(tarifConfig) {
    renderSelectMonths('#chooseDurationModal .modal-body', tarifConfig);
    bindPaymentHandler('#chooseDurationModal');
    $('#chooseDurationModal').modal('show');
}

function bindPaymentHandler(selector) {
    $(selector).find('.btn-buy-active').click(function(e) {
        e.preventDefault();
        handle_payment($(this).data('tarif'), $(this).data('pages-extra'), $(this).data('months') ? $(this).data('months') : 1);
        return false;
    });
}

function renderSelectMonths(selector, data) {
    var source = $("#select-months-template").html();
    var template = Handlebars.compile(source);
    $(selector).html(template(data));
}

function show_payment_error() {
    show_error(
        '<p>К сожалению, временно оплата невозможна. Мы работаем над устранением этой проблемы.</p><p>Приносим извинения за неудобства.</p>',
        'Оплата временно невозможна'
    );
}

function handle_payment(tarif, pages_extra, months, psp) {
    $.get('/public/php/payment_prepare.php?tarif=' + tarif + '&pages_extra=' + pages_extra + '&months=' + months + '&hash=' + Math.random()
    ).done(function(data){
        var response = $.parseJSON(data);
        var form_class = 'autoform' + ("" + Math.random()).replace('.', '');
    $('body').append(
        $('<form/>').attr('action', '/pay/redirect/').attr('method', 'post').addClass(form_class)
        .append( $('<input/>').attr('type', 'hidden').attr('name', 'summa').val(response.summa) )
        .append( $('<input/>').attr('type', 'hidden').attr('name', 'tarif').val(tarif) )
        .append( $('<input/>').attr('type', 'hidden').attr('name', 'months').val(months) )
        .append( $('<input/>').attr('type', 'hidden').attr('name', 'pages_extra').val(pages_extra) )
        .append( $('<input/>').attr('type', 'hidden').attr('name', 'psp').val(psp) )
    );
    if (response.authorized == 1) {
        reach_goal('pay-go');
        if (typeof ga != 'undefined') {
            ga('send', 'event', 'subscription', 'clickbuy', tarif, response.summa);
        }
        $('.' + form_class).submit();
    } else {
        ONQUICKLOGINREGISTER = function() { $('.' + form_class).submit(); };
        $('#quickloginregister').modal('show');
        $('.qlqr-title').text('Вход в систему');
    }
    }).fail(function(){
        // todo notify about this error
        //show_error();
    });
}

function activate_voucher(code) {
  $.post(
      '/public/php/apply_voucher.php?hash=' + Math.random(),
      { 'code': encodeURIComponent(code) }
  ).done(function(data){
    var response = $.parseJSON(data);
    if (response.error == 403) {
        ONQUICKLOGINREGISTER = function() { activate_voucher(code); };
        $('#quickloginregister').modal('show');
        $('.qlqr-title').text('Вход в систему');
    } else if (response.error != 0) {
        show_error(error_code(response.error, 'voucher'));
    } else {
        show_message('Активация прошла успешно!', response.message, 1);
    }
  }).fail(function(){
    // todo notify about this error
    //show_error();
  });
}

function process_legal_statuses(parent)
{
    $(parent).find('.legal-status').each(function(){
        $element = $(this);
        switch ($element.text()) {
            case '-1':
                $element.html('<span class="legal_span legal_unavailable">нет подписки</span>');
                break;
            case '0':
                $element.html('<span class="legal_span legal_red">нет</span>');
                break;
            case '3':
            case '4':
                $element.html('<span class="legal_span legal_orange">упоминание</span>');
                break;
            case '8':
                $element.html('<span class="legal_span legal_green">ссылка</span>');
                break;
        }
    });

    update_legal_events(parent);
}

function update_legal_events(parent)
{
    $(parent).on('click', '.legal_span', function(){
        if ($(this).hasClass('legal_unavailable')) {
            show_error(
                '<p>Мы автоматически ищем ссылку на проверяемую страницу везде, где найдены совпадения.</p>' +
                '<p>Эта информация позволит вам быстро понять, является ли копия легальной или плагиатом.</p>' +
                '<p>Поиск ссылок доступен только владельцам подписок.</p>' +
                '<div class="resized-buttons padded-top">' +
                '<div><a class="btn btn-orange-lc btn-block" role="button" href="/pay/#manual">' + ERRORS_LANG[LANG]['s']['pay.fromLowest'] + '</a></div> </div>',
                'Для поиска ссылки нужна подписка'
            );
        } else if ($(this).hasClass('legal_red')) {
            show_error(
                '<p>На странице <strong>отсутствует</strong> ссылка на проверяемый сайт или его упоминание, открытые для индексации.</p>',
                'Цитирование отсутствует'
            );
        } else if ($(this).hasClass('legal_orange')) {
            show_error(
                '<p>На странице <strong>есть упоминание</strong> адреса проверяемого сайта, <strong>но нет активной ссылки</strong>.</p><p>Упоминание открыто для индексации.</p>',
                'Упоминание без активной ссылки'
            );
        } else if ($(this).hasClass('legal_green')) {
            show_message(
                'Активная ссылка',
                '<p>На странице <strong>есть активная ссылка</strong> на проверяемый сайт, открытая для индексации.</p>'
            );
        }
    });
}

function hl_words(m)
{
    var t = $.trim($('#text').val());
    var t_hl = t.split(/(\s+)/);
    
    m_a = m.split("#");
    for (i = 0; i < m_a.length; i++){
        if (m_a[i] == '') {
            continue;
        }
        if (m_a[i].indexOf("-") < 0) {
            t_hl[ m_a[i] * 2 ] = '<b>'+t_hl[ m_a[i] * 2 ]+'</b>';
        } else {
            var m_a_i = m_a[i].split("-");
            t_hl[ m_a_i[0] * 2 ] = '<b>'+(typeof t_hl[ m_a_i[0] * 2 ] == 'undefined' ? '' : t_hl[ m_a_i[0] * 2 ]);
            t_hl[ m_a_i[1] * 2 ] = (typeof t_hl[ m_a_i[1] * 2 ] == 'undefined' ? '' : t_hl[ m_a_i[1] * 2 ])+'</b>';
        }
    }
    $('#text_hl').html( t_hl.join(" ").replace(/\n/g, '<br>') );
}

function show_error(err, title)
{
    if (typeof title == 'undefined') {
        title = 'Возникла ошибка';
    }
    $('#genericModal .modal-header').removeClass('modal-header-warning').removeClass('modal-header-info').removeClass('modal-header-promo');
    $('#genericModal .modal-header').addClass('modal-header-warning');
    $('#genericModal .modal-title').text(title);
    $('#genericModal .modal-body').html( err );
    $('#genericModal').modal('show');
}

function show_message(title, msg, no_ok_button)
{
    if (typeof no_ok_button == 'undefined') {
        msg += '<p>&nbsp;</p>';
        msg += '<p align="center"><a href="javascript:;" id="message_box_ok" data-dismiss="modal" class="btn btn-primary btn-block">Ок</a></p>';
    }
    
    $('#genericModal .modal-header').removeClass('modal-header-warning').removeClass('modal-header-info').removeClass('modal-header-promo');
    $('#genericModal .modal-header').addClass('modal-header-info');
    $('#genericModal .modal-title').html( title );
    $('#genericModal .modal-body').html( msg );
    $('#genericModal').modal('show');
}

function show_confirmation(title, msg, func_yes, func_no, btn_yes_text, btn_no_text)
{
    if (typeof btn_yes_text == 'undefined') {
        btn_yes_text = 'Да';
    }
    if (typeof btn_no_text == 'undefined') {
        btn_no_text = 'Отмена';
    }
    msg += '<p>&nbsp;</p>';
    msg += '<p align="center"><a href="javascript:;" id="confirm_box_yes" class="btn btn-primary btn-block">' + btn_yes_text + '</a>';
    msg += '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;';
    msg += '<a href="javascript:;" id="confirm_box_no" class="btn btn-primary btn-block">' + btn_no_text + '</a></p>';
    
    $('#genericModal .modal-header').removeClass('modal-header-warning').removeClass('modal-header-info').removeClass('modal-header-promo');
    $('#genericModal .modal-header').addClass('modal-header-promo');
    $('#genericModal .modal-title').html( title );
    $('#genericModal .modal-body').html( msg );
    $('#genericModal').modal('show');
    
    $('body').off('click', '#confirm_box_yes');
    $('body').off('click', '#confirm_box_no');
    $('body').on('click', '#confirm_box_yes', func_yes);
    if (typeof func_no != 'undefined') {
        $('body').on('click', '#confirm_box_no', func_no);
    }
}

function error_code(code, namespace)
{
    if (namespace == 'login' && code == '200') {
        $('#forgot_form').hide();
    }
    if (!(namespace in ERRORS_LANG[LANG])) {
        err = 'сервис временно недоступен';
    }
    else if (code in ERRORS_LANG[LANG][namespace]) {
        err = ERRORS_LANG[LANG][namespace][code];
    } 
    else if (0 in ERRORS_LANG[LANG][namespace]) {
        err = ERRORS_LANG[LANG][namespace][0];
    } else {
        err = 'сервис временно недоступен';
    }
    return err;
}

function block_elements(page) {
	if (page == 'web') {
		$('#site').prop('readOnly', true);
		$('#sitemap').prop('readOnly', true);
		var rc = parseInt($('#rc').val());
		for (var i = 1; i <= rc; i++)
        {
			$('#condition'+i).prop('disabled', true);
			$('#rule'+i).prop('readOnly', true);
		}
		$('#link').hide();
	} else if (page == 'web2') {
		$('#page').prop('readOnly', true);
		$('#link').attr('src', '/img/buttong.png');
	} else if (page == 'text') {
		$('#text').prop('readOnly', true);
		$('#ignore1').prop('readOnly', true);
		$('#ignore2').prop('readOnly', true);
		$('#task1').prop('disabled', true);
		$('#task2').prop('disabled', true);
		$('#task1_area').off('mousedown');
		$('#task2_area').off('mousedown');
		$('#link').hide();
	}
}

function unblock_elements(page) {
	if (page == 'web') {
		$('#site').prop('readOnly', false);
		$('#sitemap').prop('readOnly', false);
		var rc = parseInt($('#rc').val());
		for (var i = 1; i <= rc; i++)
        {
			$('#condition'+i).prop('disabled', false);
			$('#rule'+i).prop('readOnly', false);
		}
	} else if (page == 'web2') {
		$('#page').prop('readOnly', false);
		$('#link').attr('src', '/img/button.png');
	} else if (page == 'text') {
		$('#text').prop('readOnly', false);
		$('#ignore1').prop('readOnly', false);
		$('#ignore2').prop('readOnly', false);
		$('#task1').prop('disabled', false);
		$('#task2').prop('disabled', false);
		$('#task1_area').mousedown(function(){ $('#task1').prop('checked', true); });
		$('#task2_area').mousedown(function(){ $('#task2').prop('checked', true); });
        $('#ignore_holder').show();
		$('#link').show();
	}
	$('#link').css('display', 'inline');
}

function get_retpath()
{
    var uri_str = window.location.search + "";
    var retpath = uri_str.match(/retpath=([^&]+)/i);
    if (retpath != null) {
        return "" + decodeURIComponent(retpath[1]);
    }
    return '';
}

function get_time()
{
    var time = new Date();
    return time.getHours() + ":" + time.getMinutes() + ":" + time.getSeconds();
}

ERRORS_LANG = {
    'ru': {
        's': {
            'pay.fromLowest': 'Купить подписку от 140 рублей в месяц'
        },
        // manually queued regular pages
        'regular_manual_queue': {
            '403': 'Эта страница не оплачена и не проверяется',
            '404': 'Страница не найдена',
            '0': 'Произошла ошибка. Пожалуйста, попробуйте снова и сообщите нам, если проблема сохраниться',
        },
        // voucher
        'voucher': {
            '401': 'Этот купон уже вами использован',
            '402': 'Этот купона может быть использован только новыми пользователями',
            '404': 'Купона с таким кодом нет в нашей системе',
            '407': 'Купон использован максимальное количество раз',
            '408': 'Время действия купона закончилось',
            '0': 'Произошла ошибка. Пожалуйста, попробуйте снова и сообщите нам, если проблема сохраниться',
        },
        // history
        'history': {
            '400': 'Некорректный текст для проверки',
            '401': 'Проблема с кодировкой текста',
            '402': 'Проблема с кодировкой текста',
            '403': 'Ошибка работы скрипта',
            '404': 'Проверяемая страница недоступна',
            '406': 'На проверяемой странице слишком мало контента',
            '407': 'Ошибка работы скрипта',
            '501': 'Проверка не удалась, так как у вашего аккаунта закончился лимит ежедневных проверок.<br>Возможно, вас заинтересует <a href="/pay/#manual">покупка подписки</a>, если вам нужно расширить лимит',
            '502': 'Проверка не удалась, так как у вашего аккаунта закончился лимит ежедневных проверок.<br>Возможно, вас заинтересует <a href="/pay/#manual">покупка подписки</a>, если вам нужно расширить лимит',
            '503': 'Пакетная проверка доступна только для зарегистрированных пользователей',
            '601': 'Некорректный текст для проверки',
            '602': 'Некорректный текст для проверки',
            '666': 'Ваш IP-адрес в чёрном списке',
            '0': 'Ошибка работы скрипта',
        },
        // website check one of the set
        'website_set': {
            '400': 'Неверный урл',
            '401': 'Не удалось выделить текст на странице',
            '402': 'Не удалось определить кодировку текста',
            '403': 'Доступ запрещён',
            '404': 'Страница недоступна',
            '406': 'На странице слишком мало контента',
            '407': 'Ошибка работы скрипта',
            '501': 'Проверка не удалась, так как у вашего аккаунта закончился лимит ежедневных проверок.<br>Возможно, вас заинтересует <a href="/pay/#manual">покупка подписки</a>, если вам нужно расширить лимит',
            '502': 'Проверка не удалась, так как у вашего аккаунта закончился лимит ежедневных проверок.<br>Возможно, вас заинтересует <a href="/pay/#manual">покупка подписки</a>, если вам нужно расширить лимит',
            '503': 'Пакетная проверка доступна только для зарегистрированных пользователей<br>Пожалуйста, войдите в систему под своим логином',
            '666': 'Ваш IP-адрес в чёрном списке',
            '0': 'Сервис временно недоступен'
        },
        // website get urls
        'website_geturls': {
            '400': 'Не удалось передать данные для проверки',
            '403': 'Доступ запрещён',
            '406': 'На странице слишком мало контента',
            '501': 'Проверка не удалась, так как у вашего аккаунта закончился лимит ежедневных проверок.<br>Возможно, вас заинтересует <a href="/pay/#manual">покупка подписки</a>, если вам нужно расширить лимит',
            '502': 'Проверка не удалась, так как у вашего аккаунта закончился лимит ежедневных проверок.<br>Возможно, вас заинтересует <a href="/pay/#manual">покупка подписки</a>, если вам нужно расширить лимит',
            '666': 'Ваш IP-адрес в чёрном списке',
            '0': 'Сервис временно недоступен'
        },
        // website check single page
        'website_single': {
            '400': 'Неверный урл',
            '401': 'Не удалось выделить текст на странице',
            '402': 'Не удалось определить кодировку текста',
            '403': 'Доступ запрещён',
            '404': 'Страница недоступна',
            '406': 'На странице слишком мало контента',
            '407': 'Ошибка работы скрипта',
            '501': 'Проверка не удалась, так как у вашего аккаунта закончился лимит ежедневных проверок.<br>Возможно, вас заинтересует <a href="/pay/#manual">покупка подписки</a>, если вам нужно расширить лимит',
            '502': 'Проверка не удалась, так как у вашего аккаунта закончился лимит ежедневных проверок.<br>Возможно, вас заинтересует <a href="/pay/#manual">покупка подписки</a>, если вам нужно расширить лимит',
            '666': 'Ваш IP-адрес в чёрном списке. Если вы думаете, что это могло произойти<br>по ошибке — напишите, пожалуйста, <a href="/contacts/">запрос в службу поддержки</a>.',
            '0': 'Сервис временно недоступен'
        },
        // text check
        'text': {
            '400': 'Не удалось передать текст на проверку, возможно наличие некорректных символов',
            '401': 'Не удалось определить кодировку текста, проверка не удалась',
            '403': 'Доступ запрещён',
            '407': 'Ошибка работы скрипта',
            '501': 'Проверка не удалась, так как у вашего аккаунта закончился лимит ежедневных проверок.<br>Возможно, вас заинтересует <a href="/pay/#manual">покупка подписки</a>, если вам нужно расширить лимит',
            '502': 'Проверка не удалась, так как у вашего аккаунта закончился лимит ежедневных проверок.<br>Возможно, вас заинтересует <a href="/pay/#manual">покупка подписки</a>, если вам нужно расширить лимит',
            '601': 'Текст слишком длинный или слишком короткий',
            '602': 'Текст слишком длинный или слишком короткий',
            '666': 'Ваш IP-адрес в чёрном списке',
            '0': 'Сервис временно недоступен'
        },
        // login
        'login': {
            '200': 'Пароль успешно сброшен. Проверьте почту',
            '400': 'Неверно заполнены поля формы',
            '401': 'Неверный пароль',
            '402': 'Нет такого пользователя',
            '403': 'Неверный тикет сброса пароля',
            '500': 'Пользователь с таким email уже зарегистрирован',
            '0': 'Сервис временно недоступен'
        },
        // contacts
        'contacts': {
            '400': 'Не заполнено поле сообщения',
            '403': 'Доступ запрещён',
            '0': 'Сервис временно недоступен'
        }
    },
    'en': {
        's': {
            'pay.fromLowest': 'Subscribe from 2.99 per month'
        },
        // website check one of the set
        'website_set': {
            '400': 'Wrong url',
            '401': 'Could not get content from the web page',
            '402': 'Could not figure encoding of the page',
            '403': 'Access denied',
            '404': 'The page is unavailable',
            '406': 'There is too few content on the page',
            '407': 'There was an error during the script',
            '501': 'You have exceeded the amount of allowed checks for today<br>Consider <a href="/pay/#manual">purchasing a subscription</a> if you require bigger daily volume',
            '502': 'You have exceeded the amount of allowed checks for today<br>Consider <a href="/pay/#manual">purchasing a subscription</a> if you require bigger daily volume',
            '666': 'Your IP address is blacklisted',
            '0': 'Service is temporarily unavailable'
        },
        // website get urls
        'website_geturls': {
            '400': 'Check data was not sent properly. Please try again',
            '403': 'Access denied',
            '406': 'There is too few content on the page',
            '501': 'You have exceeded the amount of allowed checks for today<br>Consider <a href="/pay/#manual">purchasing a subscription</a> if you require bigger daily volume',
            '502': 'You have exceeded the amount of allowed checks for today<br>Consider <a href="/pay/#manual">purchasing a subscription</a> if you require bigger daily volume',
            '666': 'Your IP address is blacklisted',
            '0': 'Service is temporarily unavailable'
        },
        // website check single page
        'website_single': {
            '400': 'Wrong url',
            '401': 'Could not get content from the web page',
            '402': 'Could not figure encoding of the page',
            '403': 'Access denied',
            '404': 'The page is unavailable',
            '406': 'There is too few content on the page',
            '501': 'You have exceeded the amount of allowed checks for today<br>Consider <a href="/pay/#manual">purchasing a subscription</a> if you require bigger daily volume',
            '502': 'You have exceeded the amount of allowed checks for today<br>Consider <a href="/pay/#manual">purchasing a subscription</a> if you require bigger daily volume',
            '666': 'Your IP address is blacklisted',
            '0': 'Service is temporarily unavailable'
        },
        // text check
        'text': {
            '400': 'Check data was not sent properly. Please try again<br>If an error occurs again, please check that you do not have wierd character in text',
            '401': 'Could not figure encoding of the text',
            '403': 'Access denied',
            '407': 'There was an error during the script',
            '501': 'You have exceeded the amount of allowed checks for today<br>Consider <a href="/pay/#manual">purchasing a subscription</a> if you require bigger daily volume',
            '502': 'You have exceeded the amount of allowed checks for today<br>Consider <a href="/pay/#manual">purchasing a subscription</a> if you require bigger daily volume',
            '601': 'Text is too short or too long',
            '602': 'Text is too short or too long',
            '666': 'Your IP address is blacklisted',
            '0': 'Service is temporarily unavailable'
        },
        // login
        'login': {
            '200': 'Your password is reset. Please, check your email account',
            '400': 'Form fields are filled incorrectly',
            '401': 'Password is incorrect',
            '402': 'There is no user with this email registered',
            '500': 'The user with this email is already registered',
            '0': 'Service is temporarily unavailable'
        },
        // contacts
        'contacts': {
            '400': 'You did not fill the "message" field',
            '403': 'Access denied',
            '0': 'Service is temporarily unavailable'
        }
    }
};
