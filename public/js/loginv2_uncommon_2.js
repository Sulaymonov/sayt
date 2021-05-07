
var login_in_progress = false;
$(function(){
    
    $('.r_link').click(function(){
        register();
        return false;
    });
    $('.r_password').keydown(function(event){
        if(event.keyCode==13){
            register();
            return false;
        }
    });
    
    $('.change_link').click(function(){
        change();
        return false;
    });
    $('.change_password2').keydown(function(event){
        if(event.keyCode==13){
            change();
            return false;
        }
    });
    
    
    $('.forgot_link').click(function(){
        forgot();
        return false;
    });
    $('.forgot_login').keydown(function(event){
        if(event.keyCode==13){
            forgot();
            return false;
        }
    });
    
});


function register()
{
    if (login_in_progress) {
        return;
    }
    
    var login = $('.r_login').val().trim();
    var login2 = $('.r_login2').val().trim();
    var clname = $('.r_clname').val().trim();
    var password = $('.r_password').val().trim();
    
    var error = validate(login, password, clname);
    if (error.length) {
        show_error(error);
        return;
    }
    if (login != login2) {
        show_error('Адреса электронной почты должны совпадать');
        return;
    }
    
    login_in_progress = true;
    $('.r_loader').show();
    $('.r_submit').hide();
    
    $.get(
        '/public/php/start.php?hash=' + Math.random(), 'json'
    )
    .fail(function() {
        show_error('Сервис временно недоступен');
        login_in_progress = false;
        $('.r_loader').hide();
        $('.r_submit').show();
    })
    .done(function(data) {
        var resp = $.parseJSON(data);

        $.post(
            '/public/php/register.php?hash=' + Math.random(),
            {
                'login': encodeURIComponent(login), 'login2': encodeURIComponent(login2),
                'password': encodeURIComponent(password), 'clname': encodeURIComponent(clname),
                'code': eval(resp.code)
            }, 'json'
        )
        .fail(function() {
            show_error('Сервис временно недоступен');
            login_in_progress = false;
            $('.r_loader').hide();
            $('.r_submit').show();
        })
        .done(function(data) {
            login_in_progress = false;
            data = $.trim(data);
                
            if (data.match(/^\d+$/)) {
                show_error(error_code(data, 'login'));
            }
            else {
                document.location.href = "/login/register/?success" + get_retpath();
            }
            $('.r_loader').hide();
            $('.r_submit').show();
        });
    });  
}




function get_password_change_token()
{
    var uri_str = window.location.search + "";
    var token = uri_str.match(/change=([^&]+)/i);
    return (token == null ? '' : token[1]);
}

function change()
{
    if (login_in_progress) {
        return;
    }
    
    var login = $('.change_login').val().trim();
    var password = $('.change_password').val().trim();
    var password2 = $('.change_password2').val().trim();
    var token = get_password_change_token();
    
    var error = validate(login, password2);
    if (error.length) {
        show_error(error);
        return;
    }
    
    login_in_progress = true;
    $('.change_loader').show();
    $('.change_submit').hide();
    
    $.get(
        '/public/php/start.php?hash=' + Math.random(), 'json'
    )
    .fail(function() {
        show_error('Сервис временно недоступен');
        login_in_progress = false;
        $('.change_loader').hide();
        $('.change_submit').show();
    })
    .done(function(data) {
        var resp = $.parseJSON(data);

        $.post(
            '/public/php/changepassword.php?hash=' + Math.random(),
            {
                'login': encodeURIComponent(login),
                'password': encodeURIComponent(password),
                'token': encodeURIComponent(token),
                'password2': encodeURIComponent(password2),
                'code': eval(resp.code)
            }, 'json'
        )
        .fail(function() {
            show_error('Сервис временно недоступен');
            login_in_progress = false;
            $('.change_loader').hide();
            $('.change_submit').show();
        })
        .done(function(data) {
            login_in_progress = false;
            data = $.trim(data);
                
            if (data.match(/^\d+$/)) {
                show_error(error_code(data, 'login'));
            }
            else {
                document.location.href = "/login/change/?success" + get_retpath();
            }
            $('.change_loader').hide();
            $('.change_submit').show();
        });
    });  
}


function forgot()
{
    if (login_in_progress) {
        return;
    }
    
    var login = $('.forgot_login').val().trim();
    
    var error = validate(login);
    if (error.length) {
        show_error(error);
        return;
    }
    
    login_in_progress = true;
    $('.forgot_loader').show();
    $('.forgot_submit').hide();
    
    $.get(
        '/public/php/start.php?hash=' + Math.random(), 'json'
    )
    .fail(function() {
        show_error('Сервис временно недоступен');
        login_in_progress = false;
        $('.forgot_loader').hide();
        $('.forgot_submit').show();
    })
    .done(function(data) {
        var resp = $.parseJSON(data);

        $.post(
            '/public/php/forgotpassword.php?hash=' + Math.random(),
            { 'login': encodeURIComponent(login), 'code': eval(resp.code) }, 'json'
        )
        .fail(function() {
            show_error('Сервис временно недоступен');
            login_in_progress = false;
            $('.forgot_loader').hide();
            $('.forgot_submit').show();
        })
        .done(function(data) {
            login_in_progress = false;
            data = $.trim(data);
                
            if (data.match(/^\d+$/)) {
                show_error(error_code(data, 'login'));
            }
            else {
                document.location.href = "/login/forgot/?success" + get_retpath();
            }
            $('.forgot_loader').hide();
            $('.forgot_submit').show();
        });
    });  
}


function change2()
{
    if (login_in_progress) {
        return;
    }
    
    var login = $('#login').val().trim();
    var password = $('#password').val().trim();
    var password2 = $('#password2').val().trim();
    
    var error = validate(login, password2);
    if (error.length) {
        show_error(error);
        return;
    }
    
    login_in_progress = true;
    $('#place_for_loader').show();
    $('#btn_step2').attr('src', '/img/button2g.png');
    
    $.get(
        '/public/php/start.php?hash=' + Math.random(), 'json'
    )
    .fail(function() {
        show_error('Сервис временно недоступен');
        login_in_progress = false;
        $('#place_for_loader').hide();
        $('#btn_step2').attr('src', '/img/button2.png');
    })
    .done(function(data) {
        var resp = $.parseJSON(data);

        $.post(
            '/public/php/changepassword.php?hash=' + Math.random(),
            { 'login': encodeURIComponent(login), 'password': encodeURIComponent(password), 'password2': encodeURIComponent(password2), 'code': eval(resp.code) }, 'json'
        )
        .fail(function() {
            show_error('Сервис временно недоступен');
            login_in_progress = false;
            $('#place_for_loader').hide();
            $('#btn_step2').attr('src', '/img/button2.png');
        })
        .done(function(data) {
            login_in_progress = false;
            data = $.trim(data);
                
            if (data.match(/^\d+$/)) {
                show_error(error_code(data, 'login'));
            }
            else {
                document.location.href = "/login/change/?success" + get_retpath();
            }
            $('#place_for_loader').hide();
            $('#btn_step2').src = '/img/button2.png';
        });
    });  
}
