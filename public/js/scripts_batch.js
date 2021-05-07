
$(function(){

});

// fired when user has selected section or multiple sections
// urls are in batch check text area
function onBatchEvent() {
    check_batch_list();
}

function check_batch(list)
{
    if (list.length < 1) {
        show_error('Не переданы адреса страниц для проверки');
        return false;
    }
    $('.batch-check-btn').hide();
    $('.batch-waiting-redirect').show();

    $.get(
        '/public/php/checker_start.php?r=' + Math.random(), 'json'
    ).fail(function() {
        show_error('<strong>Сервис временно недоступен</strong>');
        $('.batch-waiting-redirect').hide();
        $('.batch-check-btn').show();
    }).done(function(data) {

        var resp = $.parseJSON(data);
        $.post(
            '/public/php/check_batch.php?r=' + Math.random(), {
                'list': list,
                'code': eval(resp.code)
            }, 'json'
        ).fail(function () {
            show_error('<strong>Сервис временно недоступен</strong>');
            $('.batch-waiting-redirect').hide();
            $('.batch-check-btn').show();
        }).done(function (data) {
            var resp = $.parseJSON(data);
            if (parseInt(resp.error) > 0) {
                show_error(error_code(resp.error, 'website_set'));
                $('.batch-waiting-redirect').hide();
                $('.batch-check-btn').show();
                return;
            }
            document.location.href = '/cabinet/history/batch/' + resp.batch_hash + '/';
        });
    });
}

function check_batch_list()
{
    var urls = $.trim($('#set_pages').val());
    if (urls == '') {
        show_error('Нечего проверять');
        return false;
    }
    check_batch(urls.split("\n"));
}
