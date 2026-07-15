$(function() {
  $('#change-skin').on('click', function () {
    $("body").toggleClass("page-dark-mode");
    localStorage.setItem('bj-dark-mode', $("body").hasClass("page-dark-mode"));
    BeautifulJekyllJS.initNavbar();
  });
  if (localStorage.getItem('bj-dark-mode') === 'true') {
    $('#change-skin').trigger('click');
  }
});

function disableHighlight() {
  const style = document.createElement('style');
  style.textContent = `
      .mark {
          background: none;
      }
      
      .page-dark-mode .mark {
        background: none;
      }`;
  document.head.append(style);
  console.log('highlight disabled')
}