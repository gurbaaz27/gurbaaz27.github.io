// $(function() {
//     $('#change-skin').on('click', function () {
//       $("body").toggleClass("page-dark-mode");
//       BeautifulJekyllJS.initNavbar();
//     });
//   });
$(function() {
    var theme;

    if (localStorage.getItem('theme')) {  
      theme = localStorage.getItem('theme');  
    } else {  
      theme = 'dark';  
    }
    console.log(theme);
    if (theme == 'dark') {
      $("body").toggleClass("page-dark-mode");
    }

    localStorage.setItem('theme', theme);

    $('#change-skin').on('click', function () {
      $("body").toggleClass("page-dark-mode");
      BeautifulJekyllJS.initNavbar();

      if (localStorage.getItem('theme') == 'dark') {
        localStorage.setItem('theme', 'light'); 
      } else {
        localStorage.setItem('theme', 'dark');
      }
    });
  });