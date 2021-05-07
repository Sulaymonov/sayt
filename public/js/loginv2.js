
var login_in_progress = false;
$(function(){
    
    
    $('.qr_link').click(function(){
        register_quick();
        return false;
    });
    $('.qr_login, .qr_login2').keydown(function(event){
        if(event.keyCode==13){
            register_quick();
            return false;
        }
    });
    $('.goto_qr').click(function(event){
        $('.qlogin_block').hide();
        $('.qr_block').show();
        $('.qlqr-title').text('Регистрация');
    });
    
    
    $('.qlogin_link').click(function(){
        login_quick();
        return false;
    });
    $('.qlogin_password').keydown(function(event){
        if(event.keyCode==13){
            login_quick();
            return false;
        }
    });
    
    
    $('.login_link').click(function(){
        login();
        return false;
    });
    $('.login_password').keydown(function(event){
        if(event.keyCode==13){
            login();
            return false;
        }
    });
    
});

function validate(login, password, clname)
{
    if (typeof login == 'undefined') {
        return 'Пожалуйста, введите ваш E-Mail';
    }
    if (login.trim().length < 5 || !login.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+[.][a-zA-Z]{2,10}$/)) {
        return 'Пожалуйста, проверьте E-Mail.<br>Похоже, он введен некорректно';
    }
    if (typeof password != 'undefined' && password.trim() == '') {
        return 'Пожалуйста, введите ваш пароль';
    }
    return '';
}


function register_quick(callable)
{
    if (login_in_progress) {
        return;
    }
    
    var login = $('.qr_login').val().trim();
    var login2 = $('.qr_login2').val().trim();
    $('.login-errors').text('').hide();
    
    var error = validate(login);
    if (error.length) {
        $('.login-errors').html(error).show();
        // show_error(error);
        return;
    }
    if (login != login2) {
        show_error('Адреса электронной почты должны совпадать');
        return;
    }
    
    login_in_progress = true;
    $('.qr_loader').show();
    $('.qr_submit').hide();
    
    $.get(
        '/public/php/start.php?hash=' + Math.random(), 'json'
    )
    .fail(function() {
        $('.login-errors').text('Сервис временно недоступен').show();
        // show_error('Сервис временно недоступен');
        login_in_progress = false;
        $('.qr_loader').hide();
        $('.qr_submit').show();
    })
    .done(function(data) {
        var resp = $.parseJSON(data);

        $.post(
            '/public/php/register.php?hash=' + Math.random(),
            {
                'login': encodeURIComponent(login),
                'login2': encodeURIComponent(login2),
                'code': eval(resp.code)
            }, 'json'
        )
        .fail(function() {
            $('.login-errors').text('Сервис временно недоступен').show();
            // show_error('Сервис временно недоступен');
            login_in_progress = false;
            $('.qr_loader').hide();
            $('.qr_submit').show();
        })
        .done(function(data) {
            login_in_progress = false;
            data = $.trim(data);
                
            if (data.match(/^\d+$/)) {
                $('.login-errors').html(error_code(data, 'login')).show();
                // show_error(error_code(data, 'login'));
            }
            else {
                // document.location.href = "/login/register/?success" + action + get_retpath();
                if (typeof callable != 'undefined') {
                    callable();
                }
                if (typeof ONQUICKLOGINREGISTER != 'undefined') {
                    ONQUICKLOGINREGISTER();
                }
            }
            $('.qr_loader').hide();
            $('.qr_submit').show();
        });
    });
}

function login()
{
    if (login_in_progress) {
        return;
    }
    
    var login = $('.login_login').val().trim();
    var password = $('.login_password').val().trim();
    $('.login-errors').text('').hide();
    
    var error = validate(login, password);
    if (error.length) {
        $('.login-errors').html(error).show();
        // show_error(error);
        return;
    }
    
    login_in_progress = true;
    $('.login_loader').show();
    $('.login_submit').hide();
    
    $.get(
        '/public/php/start.php?hash=' + Math.random(), 'json'
    )
    .fail(function() {
        $('.login-errors').text('Сервис временно недоступен').show();
        // show_error('Сервис временно недоступен');
        login_in_progress = false;
        $('.login_loader').hide();
        $('.login_submit').show();
    })
    .done(function(data) {
        var resp = $.parseJSON(data);

        $.post(
            '/public/php/loginv2.php?hash=' + Math.random() + get_retpath(),
            { 'login': encodeURIComponent(login), 'password': encodeURIComponent(password), 'code': eval(resp.code) }, 'json'
        )
        .fail(function() {
            $('.login-errors').text('Сервис временно недоступен').show();
            // show_error('Сервис временно недоступен');
            login_in_progress = false;
            $('.login_loader').hide();
            $('.login_submit').show();
        })
        .done(function(data) {
            login_in_progress = false;
            data = $.trim(data);
                
            if (data.match(/^\d+$/)) {
                $('.login-errors').html(error_code(data, 'login')).show();
                // show_error(error_code(data, 'login'));
            }
            else {
                // document.location.href = "/login/?success" + get_retpath();
                // $('#savePasswordForm').submit();
                $('.post-login').removeClass('hidden');
                $('.pre-login').addClass('hidden');
                $('.modal').modal('hide');
                $('#savePasswordForm').click();
                $('div.active-session').show();
                $('div.login-btn').hide();
                $('div.information_grid').hide();
                $('div.outer').prepend('<div class="information_grid">Вы успешно авторизовались</div>');
                
                var retpath = get_retpath();
                if (retpath.length > 0) {
                    document.location.href = retpath;
                } else if (typeof DISABLE_PAGE_RELOAD_ON_LOGIN == 'undefined') {
                    document.location.href = location.pathname + location.search + location.hash;
                }
            }
            $('.login_loader').hide();
            $('.login_submit').show();
        });
    });  
}



function login_quick(callable)
{
    if (login_in_progress) {
        return;
    }
    
    var login = $('.qlogin_login').val().trim();
    var password = $('.qlogin_password').val().trim();
    $('.login-errors').text('').hide();
    
    var error = validate(login, password);
    if (error.length) {
        $('.login-errors').html(error).show();
        // show_error(error);
        return;
    }
    
    login_in_progress = true;
    $('.qlogin_loader').show();
    $('.qlogin_submit').hide();
    
    $.get(
        '/public/php/start.php?hash=' + Math.random(), 'json'
    )
    .fail(function() {
        $('.login-errors').text('Сервис временно недоступен').show();
        // show_error('Сервис временно недоступен');
        login_in_progress = false;
        $('.qlogin_loader').hide();
        $('.qlogin_submit').show();
    })
    .done(function(data) {
        var resp = $.parseJSON(data);

        $.post(
            '/public/php/loginv2.php?hash=' + Math.random(),
            { 'login': encodeURIComponent(login), 'password': encodeURIComponent(password), 'code': eval(resp.code) }, 'json'
        )
        .fail(function() {
            $('.login-errors').text('Сервис временно недоступен').show();
            // show_error('Сервис временно недоступен');
            login_in_progress = false;
            $('.qlogin_loader').hide();
            $('.qlogin_submit').show();
        })
        .done(function(data) {
            login_in_progress = false;
            data = $.trim(data);
                
            if (data.match(/^\d+$/)) {
                $('.login-errors').html(error_code(data, 'login')).show();
                // show_error(error_code(data, 'login'));
            }
            else {
                // document.location.href = "/login/?success" + action + get_retpath();
                if (typeof callable != 'undefined') {
                    callable();
                }
                if (typeof ONQUICKLOGINREGISTER != 'undefined') {
                    ONQUICKLOGINREGISTER();
                }
            }
            $('.qlogin_loader').hide();
            $('.qlogin_submit').show();
        });
    });
}



