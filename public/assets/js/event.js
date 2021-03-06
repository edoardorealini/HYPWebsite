var months = {
	1: "January",
	2: "February",
	3: "March",
	4: "April",
	5: "May",
	6: "June",
	7: "July",
	8: "August",
	9: "September",
	10: "October",
	11: "November",
	12: "December"
}

//load dinamically from cache (deprecated system)
//var event_to_display = window.sessionStorage.getItem("event_to_display");


//loading from the URL which is the event to display
console.log("Loading event page");
let urlParams = new URLSearchParams(window.location.search);
let event_to_display = urlParams.get('id');
let gt_mode = urlParams.get("event-gt");
let event_month = 0;


$(document).ready(function () {

	//this var is updated when the info about the event is retrieved
	var contact_to_display = 0;
	var card_max_width = "100%";

	if (gt_mode == "none") {
		nextButton = document.getElementById("next-event");
		prevButton = document.getElementById("previous-event");
		nextButton.classList.add("disappear");
		prevButton.classList.add("disappear");
	}


	//con questa prima fetch andiamo a RIEMPIRE gli elementi statici della pagina
	fetch("https://hyp-ave.herokuapp.com/v2/events/".concat(event_to_display)).then(function (response) { //qui la query la facciamo all'evento specifico con ID
		return response.json();
	}).then(function (json) {
		console.log(json);

		//TODO fare controllo sul risultato della chiamata (serve??)

		var title = document.getElementById("event-title");
		var description = document.getElementById("description-text");
		var image = document.getElementById("main-image");
		var breadcrumb = document.getElementById("current-page");
		var date = document.getElementById("date");
		var time = document.getElementById("time");
		var city_html = document.getElementById("city");
		var address_html = document.getElementById("address");

		let {
			eventId,
			name,
			hour,
			day,
			month,
			year,
			address,
			city,
			picturePath,
			descriptionText,
			contactPerson
		} = json[0];

		console.log("contact person found in event object: ".concat(contactPerson));

		contact_to_display = contactPerson;

		console.log("contact person id: ".concat(contact_to_display));

		title.innerHTML = name;
		description.innerHTML = descriptionText;
		image.src = picturePath;
		image.alt = "main-image-event-" + eventId;
		breadcrumb.innerHTML = name;

		event_month = month;

		var string_month = months[month];
		var string_day = pretty_day(day);
		var pretty_date = string_month.concat(" ").concat(string_day).concat(" ".concat(year));

		date.children[0].innerHTML = pretty_date;
		time.innerHTML = hour;
		city_html.children[0].innerHTML = city;
		address_html.innerHTML = address;

	}).then(function () {
		fetch("https://hyp-ave.herokuapp.com/v2/people/".concat(contact_to_display)).then(function (response) { //chiamata specifica alla persona con id contact_to_display
			return response.json();
		}).then(function (json) {

			console.log(json);

			if (json.length > 1) {
				console.log("ERROR, TOO MANY PEOPLE");
				var related_person_col = document.getElementById("related-person-col")
				related_person_col.classList.add("disappear");
				return;
			}
			if (json.length == 0) {
				console.log("ERROR, NO PEOPLE FOUND FOR THIS SERVICE");
				var related_person_col = document.getElementById("related-person-col")
				related_person_col.classList.add("disappear");
				return;
			}

			let {
				personId,
				nameAndSurname,
				birthday,
				picturePath,
				telephone,
				email,
				descriptionText,
				profession,
				role
			} = json[0];

			var contact_card_div = document.getElementById("contact-person-card");
			var card = createPersonCard(personId, nameAndSurname, role, picturePath, card_max_width, profession); //fatto apposta così è facile da iterare
			card.appendTo(contact_card_div);

		});
	});

	//creazione dell'elenco di servizi legati allo specifico evento
	fetch("https://hyp-ave.herokuapp.com/v2/services/servicesOfEvent/" + event_to_display).then(function (response) { //chiamata specifica all'elenco di servizi legati all'evento (API pronta)
		return response.json();
	}).then(function (json) {

		console.log(json);

		//AGGIUNGERE FILTRO SUI SERVIZI CON CAMPO event UGUALE ALL'EVENTO CHE SI STA CARICANDO

		var list_len = json.length;
		var i = 0;
		var services_div = document.getElementById("presented-services-cards");

		if (list_len == 0) {
			console.log("ERROR, NO SERVICES FOUND");
			var related_services_col = document.getElementById("presented-service-col")
			related_services_col.classList.add("disappear");
			return;
		}

		if (list_len > 2) {
			console.log("ERROR, TOO MANY SERVICES");
			var related_services_col = document.getElementById("presented-service-col")
			related_services_col.classList.add("disappear");
			return;
		}

		for (i = 0; i < list_len; i++) {

			let {
				serviceId,
				name,
				type,
				picturePath,
				descriptionText,
				address,
				eventId
			} = json[i];
			var card = createServiceCard(serviceId, card_max_width, picturePath, name, type, descriptionText); //fatto apposta così è facile da iterare
			card.appendTo(services_div);

		}

	});

});

function goToPerson(personId) {
	console.log("Going to person ".concat(personId));
	personId = String(personId);
	//window.sessionStorage.setItem('person_to_display', personId);
	window.location = "./person.html" + "?id=" + personId + "&person-gt=none";
}

function goToService(serviceId) {
	console.log("Going to service ".concat(serviceId));
	serviceId = String(serviceId);
	//window.sessionStorage.setItem('service_to_display', serviceId);
	window.location = "./service.html" + "?id=" + serviceId + "&service-gt=none";
}

function previousEvent() {

	if (gt_mode == "month") {

		let events = window.sessionStorage.getItem("events-of-month");
		events = JSON.parse(events);
		id_list = getListOfIds(events);
		id_list_len = id_list.length;

		event_to_show = 0;
		index = findIndex(event_to_display, id_list);
		if (index == 0) {
			event_to_show = id_list_len - 1;
		}
		else {
			event_to_show = id_list[index - 1];
		}

		window.location = "./event.html" + "?id=" + event_to_show + "&month=" + event_month + "&event-gt=month";
	}

	if (gt_mode == "today") {
		//TODO
	}

}

function nextEvent() {


	if (gt_mode == "month") {
		let events = window.sessionStorage.getItem("events-of-month");
		events = JSON.parse(events);
		id_list = getListOfIds(events);
		id_list_len = id_list.length;

		event_to_show = 0;

		index = findIndex(event_to_display, id_list);
		if (index == id_list_len - 1) {
			event_to_show = id_list[0];
		}
		else {
			event_to_show = id_list[index + 1];
		}

		window.location = "./event.html" + "?id=" + event_to_show + "&month=" + event_month + "&event-gt=month";
	}

	if (gt_mode == "today") {
		//TODO
	}


}

function getListOfIds(events) {
	id_list = [];
	for (event of events) {
		id_list.push(event["eventId"]);
	}
	return id_list;
}

function findIndex(event_code, code_list) {
	return code_list.findIndex(function check(el) {
		return el == event_code;
	});
}

function createPersonCard(personId, personNameSurname, personRole, img_path, card_max_width, profession) {

	var container = $('<div />')
		.addClass("row no-gutters top-10")

	var card = $('<div />')
		.addClass("card card-dim")
		.attr("style", "max-width: " + card_max_width + ";")
		.appendTo(container)


	var row = $('<div />')
		.addClass("row-card")
		.appendTo(card)

	var col4 = $('<div />')
		.addClass("col-img-card")
		.appendTo(row)

	$('<img />')
		.attr('src', img_path) //image relative path
		.addClass("img-card-madsomma card-img")
		.attr("alt", "image-person-" + personId)
		.attr("style", "max-width: 350px;")
		.appendTo(col4);

	var col8 = $('<div />')
		.addClass("col-body-card")
		.appendTo(row)

	var cardbody = $("<div />")
		.addClass("card-body-mad")
		.appendTo(col8);

	$("<h5 />")
		.addClass("card-title")
		.appendTo(cardbody)
		.text(personNameSurname)

	$("<p />")
		.addClass("card-text")
		.appendTo(cardbody)
		.text("Role: " + personRole)

	$("<p />")
		.addClass("card-text description-text")
		.appendTo(cardbody)
		.text("Profession: " + profession)

	var button_div = $("<div />")
		.addClass("text-right")
		.appendTo(cardbody)

	$("<button />")
		.addClass("button-card btn btn-info text-light")
		.attr("onclick", "goToPerson(" + personId + ")")
		.appendTo(button_div)
		.text("Read more about this person")

	return container;
}

function createServiceCard(serviceId, card_max_width, img_path, name, type, descriptionText) {

	var card = $('<div />')
		.addClass("card card-dim top-10")
		.attr("style", "max-width: " + card_max_width + ";")

	var row = $('<div />')
		.addClass("row-card")
		.appendTo(card)

	var col4 = $('<div />')
		.addClass("col-img-card")
		.appendTo(row)

	$('<img />')
		.attr('src', img_path) //image relative path
		.addClass("img-card-madsomma card-img")
		.attr("alt", "image-event-" + serviceId)
		.appendTo(col4);

	var col8 = $('<div />')
		.addClass("col-body-card")
		.appendTo(row)

	var cardbody = $("<div />")
		.addClass("card-body-mad")
		.appendTo(col8);

	$("<h5 />")
		.addClass("card-title")
		.appendTo(cardbody)
		.text(name)

	$("<p />")
		.addClass("card-text")
		.appendTo(cardbody)
		.text(type)

	var brief_description = descriptionText.slice(0, 70);

	$("<div />")
		.addClass("card-text description-text")
		.appendTo(cardbody)
		.text(brief_description + "...")


	var button_div = $("<div />")
		.addClass("text-right")
		.appendTo(cardbody)

	$("<button />")
		.addClass("button-card btn text-light")
		.attr("onclick", "goToService(" + serviceId + ")")
		.appendTo(button_div)
		.text("Read more about this service")

	return card;
}


function pretty_day(day) {
	var j = day % 10,
		k = day % 100;
	if (j == 1 && k != 11) {
		return day + "st";
	}
	if (j == 2 && k != 12) {
		return day + "nd";
	}
	if (j == 3 && k != 13) {
		return day + "rd";
	}
	return day + "th";
}

/*
var myList = document.querySelector("ul");
    fetch("v2/events/todaysevents").then(function(response){
        return response.json();
    }).then(function(json) {
        console.log(json);

        for (var i=0; i<json.length; i++){
            console.log("in da for");
            console.log(JSON.stringify(json));
            var listItem = document.createElement("li");
            let {eventId, name, hour, day, month, year, address, city, picturePath, descriptionText, contactPerson} = json[i];
            listItem.innerHTML = `${eventId} - ${day} - ${descriptionText} (${contactPerson}) `;
            myList.appendChild(listItem);
            console.log("my list", myList);
        }
    });
*/