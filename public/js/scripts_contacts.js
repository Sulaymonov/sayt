
// TEXT FUNCTIONS

$(function(){
    $('.contacts_submit').click(function(){
        send_mail();
        return false;
    });
});
function send_mail()
{
	var text = $.trim($('.contacts_text').val());
	var email = $.trim($('.contacts_login').val());
    if (email == '' && !confirm("Вы не указали email и мы не сможем Вам ответить. Всё равно отправить сообщение?")) {
        return false;
    }
    
	if (text.length < 20) {
		show_error('Текст слишком короткий');
    $('.contacts_text').focus();
		return false;
	}
	var name = $.trim($('.contacts_name').val());
  $('.contacts_loader').show();
  $('.contacts_submit').hide();
    
  $.get(
      '/public/php/start.php?hash=' + Math.random(), 'json'
  )
  .fail(function() {
      show_error('Сервис временно недоступен');
      $('.contacts_loader').hide();
      $('.contacts_submit').show();
  })
  .done(function(data) {
      var resp = $.parseJSON(data);
              
      $.post(
          '/public/php/send_mail.php?hash=' + Math.random(),
          { 'name': encodeURIComponent(name), 'email': encodeURIComponent(email), 'text': encodeURIComponent(text), 'code': eval(resp.code) }, 'json'
      )
      .fail(function() {
          show_error('Сервис временно недоступен');
          $('.contacts_loader').hide();
          $('.contacts_submit').show();
      })
      .done(function(data) {
      
          if (data.match(/^\d+$/)) {
              show_error(error_code(data, 'contacts'));
              $('.contacts_loader').hide();
              $('.contacts_submit').show();
              return;
          }
          
          // $('#forma').html(data + '<br><br>');
          $('.contacts_result').show();
          $('.contacts_submit').hide();
          $('.contacts_loader').hide();
          show_message('Результат отправки сообщения', data);
      });
  });
}