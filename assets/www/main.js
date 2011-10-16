var user = null;
var data = null;
var server_ip = "67.176.252.98/owe"; //hackish
//var server_ip = "localhost";

/*
 * Called on index.html's body load
 */
function init()
{
    // Do something here to check if we've stored logon credentials
    // Then just redirect
    // also load data from local file

    $("#doing_ajax").hide();
    $("#addt_ajax").hide();
}

/*
 * Called when the submit button is hit on the login page
 */
function login()
{
    user = document.getElementById("user").value.toUpperCase();
    // FIXME strip user ?
    document.getElementById("overview_hdr").innerHTML = user;

    //clear the overview page
    data = null;

//    window.location = "index.html#overview_page"; // OR location.hash = "#overview_page"; ??
    //maybe this is a better way of doing it...
    $.mobile.changePage("#overview_page");
}

/*
 * Grab json from server
 * TODO: make this use ajax_send_req
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
                var resp = null;
                try {
                    resp = JSON.parse(this.responseText);
                }
                catch(e) {
                    alert("update failed: bad json recvd\n" + e);
                    $("#doing_ajax").hide();
                    return;
                }

                if (resp.status === "OK") {
                    data = resp.data;
                    $.mobile.changePage($.mobile.activePage, { "allowSamePageTransition" : true, "transition" : "none" });
                }
                else {
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

function ajax_send_req(req, done_fn, start_fn, end_fn)
{
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                var resp = null;
                try {
                    resp = JSON.parse(this.responseText);
                } catch(e) {
                    alert("recvd bad json\n" + e);
                    end_fn();
                    return;
                }
                done_fn(resp);
            }
            else {
                alert("ajax failed: " + this.status);
            }
            end_fn();
        }
    }
    //hacky get and post at the same time, kinda, really post
    xhr.open("POST", "http://" + server_ip + "/owe.php?ts=" + new Date().getTime() + "&action=REQUEST&user=" + user, true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send(JSON.stringify(req));
    start_fn();
}

function add_transaction()
{
    var who = $("#addt_who").val();
    var what = $("#addt_what").val();
    var when = Date.parse($("#addt_when").val());
    var amt = parseFloat($("#addt_amt").val());
    var trans = {
        "who" : who,
        "what" : what,
        "when" : when,
        "amt" : amt
    };
    var req = {
        "type" : "ADD",
        "trans" : trans
    };
    ajax_send_req(req, function(response) {
        if (response.status == "OK") {
            alert("added");
            update();
        } else {
            alert("add failed\n" + response.status + ": " + response.reason);
        }
    },
    function() {
        $("#addt_ajax").show();
    },
    function() {
        $("#addt_ajax").hide();
    });
}

//bad globals... =(
var current_request = null;

function req_click(req) {
    current_request = req;
    $.mobile.changePage("accept_dg.html", { "transition" : "pop" });
}

function accept_req(accept)
{
    var req = current_request;
    if (accept) {
        req.type = "ACCEPT";
    } else {
        req.type = "DENY";
    }
    ajax_send_req(req, function(resp) {
        if (resp.status == "OK") {
            alert(req.type + "ED\nPlease Update");
        } else {
            alert("accept failed\n" + resp.status + ": " + resp.reason);
        }
    },
    function() {
        $("#acceptdg_loader").show();
    },
    function() {
        $("#acceptdg_loader").hide();
    });
    $('.ui-dialog').dialog('close').
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
                   '<div class="ui-btn-inner ui-li ui-corner-top">' +
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
        return;
    }

    // TODO: you can make ul part of class ui-listview, -inset, ui-shadow etc.
    $("#overviewcontent").append("<ul data-role=\"listview\" data-inset=\"true\" id=\"request_list\"></ul>");
    for(var i in data.recvd_requests) {
        var cr = data.recvd_requests[i];
        var ct = cr.trans;
        var li = '<li class="ui-btn ui-li" onclick=\'req_click(' + JSON.stringify(cr) + ');\'>' +
                   '<div class="ui-btn-inner ui-li ui-corner-top">' +
                     '<div class="ui-btn-text">' +
                         '<p class="ui-li-aside ui-li-desc">' + new Date(ct.when).toDateString() + '</p>' +
                         '<h3 class="ui-li-heading">' + ct.who + '(' + cr.id + ')' + '</h3>' +
                         '<p class="ui-li-desc">' + ct.what + " " + ct.amt + '</p>' +
                     '</div>' +
                   '</div>' +
                 '</li>';
        $("#request_list").append(li);
    }
    $("#request_list").listview();
});

$("#addt_page").live("pageshow", function(jqm_obj) {
    var d = new Date();
    $("#addt_when").val(d.toDateString());
});
