
$('.brand_slider_1').slick({
    infinite: true,
    speed: 6000,
    slidesToShow: 6,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 0,
    arrows: false,
    // pauseOnFocus: false,
    // pauseOnHover: false,
    cssEase: 'linear',
    responsive: [
        {
            breakpoint: 992,
            settings: {
                slidesToShow: 4,
            },
            breakpoint: 767,
            settings: {
                slidesToShow: 3,
            }
        }
    ]
});

$('.brand_slider_2').slick({
    autoplay: true,
    autoplaySpeed: 0,
    speed: 6000,
    arrows: false,
    swipe: false,
    slidesToShow: 6,
    cssEase: 'linear',
    pauseOnFocus: false,
    pauseOnHover: false,
    rtl: true,
    responsive: [
        {
            breakpoint: 992,
            settings: {
                slidesToShow: 4,
            },
            breakpoint: 991,
            settings: {
                slidesToShow: 5,
            },
            breakpoint: 767,
            settings: {
                slidesToShow: 3,
            }
        }
    ]
});


jQuery(document).ready(function ($) {

    $('.titleWrapper').on('click', function () {

        var current = $(this).closest('.tab-accordian').find('.desWrapper');

        if (current.is(':visible')) {
            current.slideUp();
            $(this).removeClass('active').addClass('inactive');
        } else {
            $('.desWrapper').slideUp();
            $('.titleWrapper').removeClass('active').addClass('inactive');

            current.slideDown();
            $(this).removeClass('inactive').addClass('active');
        }

    });

});



$(document).ready(function () {

    $(".testimonial_slider").slick({

        slidesToShow: 3,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 2000,
        arrows: false,
        dots: false,


        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    arrows: false,

                    slidesToShow: 2,
                }
            },
            {
                breakpoint: 992,
                settings: {
                    arrows: false,

                    slidesToShow: 2,
                }
            },


            {
                breakpoint: 768,
                settings: {
                    arrows: false,

                    slidesToShow: 1,
                }
            },
            {
                breakpoint: 576,
                settings: {
                    arrows: false,

                    slidesToShow: 1,
                }
            }
        ]

    });

});

document.addEventListener("DOMContentLoaded", function () {

    const counters = document.querySelectorAll('.counter');

    counters.forEach(counter => {
        let target = parseInt(counter.innerText.replace("+", ""));
        let count = 0;
        let speed = 20; // speed control (kam value = fast)

        function updateCounter() {
            let increment = target / 100; 

            if (count < target) {
                count += increment;
                counter.innerText = Math.ceil(count) + "+";
                setTimeout(updateCounter, speed);
            } else {
                counter.innerText = target + "+";
            }
        }

        updateCounter();
    });

});



jQuery(document).ready(function($){
	$('.titleWrapper').click(function(){
		var toggle = $(this).next('div#descwrapper');
		$(toggle).slideToggle("slow");
	});
    $('.inactive').click(function(){
		$(this).toggleClass('inactive active');
	});

    // Mobile menu toggle logic
    $('.menu-toggle').on('click', function() {
        $('.nav_menu_mobile').addClass('show');
        $('.overlay').addClass('show');
        $('body').css('overflow', 'hidden'); // Prevent scrolling
    });

    $('.close-menu, .overlay').on('click', function() {
        $('.nav_menu_mobile').removeClass('show');
        $('.overlay').removeClass('show');
        $('body').css('overflow', 'auto');
    });
});


