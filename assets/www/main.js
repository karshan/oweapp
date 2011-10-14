var user = null;
var data = null;

/*
 * Called on index.html's body load
 */
function init()
{
    // Do something here to check if we've stored logon credentials
    // Then just redirect
    // also load data from local file

    $("#doing_ajax").hide();
}

/*
 * Called when the submit button is hit on the login page
 */
function login()
{
    user = document.getElementById("user").value.toUpperCase();
    // FIXME strip user ?
    document.getElementById("overview_hdr").innerHTML = "Welcome " + user;

    //clear the overview page
    data = null;

//    window.location = "index.html#overview_page"; // OR location.hash = "#overview_page"; ??
    //maybe this is a better way of doing it...
    $.mobile.changePage("#overview_page");
}

var server_ip = "67.176.252.98/owe"; //hackish

/*
 * Grab json from server
 */
function update()
{
    if (user === null) {
        alert("Login First!");
        return;
    }
    req = new XMLHttpRequest();
    req.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                var resp = eval('(' + this.responseText + ')'); // FIXME: use JSON.parse
                if (resp.status === "OK") {
                    data = resp.data;
                } else {
                    alert("update failed: " + resp.reason);
                }
            }
            else {
                alert("ajax failed, status = " + this.status);
            }
            $("#doing_ajax").hide();
        }
    }
    req.open("GET", "http://" + server_ip + "/owe.php?action=GET&user=" + user, true);
    req.send();
    $("#doing_ajax").show();
    //TODO: prevent transaction list button from being pressed...
}

$("#tl_page").live("pageshow", function(jqm_obj) {
    $("#tl_list").remove();
    if (data === null) {
        alert("NO DATA!");
        return;
    }

    $("#tl_content").append("<ul data-role=\"listview\" data-inset=\"true\" id=\"tl_list\"></ul>");
    for(var i in data.trans_list) {
        var ct = data.trans_list[i];

        // TODO: better way to do this (setup html li string)
        var li = '<li class="ui-btn ui-li">' +
                   '<div class="ui=btn-inner ui-li ui-corner-top">' +
                     '<div class="ui-btn-text">' +
                       '<p class="ui-li-aside ui-li-desc">' + new Date(ct.when).toDateString() + '</p>' +
                       '<h3 class="ui-li-heading">' + ct.who + '</h3>' +
                       '<p class="ui-li-desc">' + ct.what + " " + ct.amt + '</p>' +
                     '</div>' +
                   '</div>' +
                 '</li>';
        $("#tl_list").append(li);
    }
    $("#tl_list").listview();
});

$("#overview_page").live("pageshow", function(jqm_obj) {
    $("#request_list").remove();
    if (data === null) {
        //alert("NO DATA!"); TODO something better
        update();
//        return;
    }

    // TODO: you can make ul part of class ui-listview, -inset, ui-shadow etc.
    $("#overviewcontent").append("<ul data-role=\"listview\" data-inset=\"true\" id=\"request_list\"></ul>");
    //for(var i in data.requests) {
        var li = '<li>WIP</li>'; //TODO
        $("#request_list").append(li);
    //}
    $("#request_list").listview();
});
