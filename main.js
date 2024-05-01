/*
This is a fan made Emulator for "Milky way Idle" games Enhancing mechanic by (MangoFlavor).
Obviously i do not own the game nor any art assets in the this projects
*/

var worker = "",
enhance_bonus = [
	1, // +0
	1.02, // +1
	1.042, // +2
	1.066, // +3
	1.092, // +4
	1.12, // +5
	1.15, // +6
	1.182, // +7
	1.216, // +8
	1.252, // +9
	1.29, // +10
	1.33, // +11
	1.372, // +12
	1.416, // +13
	1.462, // +14
	1.51, // +15
	1.56, // +16
	1.612, // +17
	1.666, // +18
	1.722, // +19
	1.78 // +20
],
save_data = {
  enhancing_level: 0,
  laboratory_level: 0,
  enhancer_level: 0,
  selected_enhancer: "btn_cheese_enhancer",
  use_enchanted: false,
  enchanted_level: 0,

  tea_enhancing: false,
  tea_super_enhancing: false,
  tea_blessed: false,
  tea_wisdom: false,

  selected_item: "",
  stop_at: 10,

  hourly_rate: 3000000,
  percent_rate: 2,
},
sim_data = {
  item_level: 0,
  protect_at: 2,
  protect_element_id: "",
  protect_price: 0,
  protect_1_hrid: "",
  protect_2_hrid: "",
  protect_3_hrid: "",
  protect_4_hrid: "",
  protect_5_hrid: "",
  total_bonus: 0,
  attempt_time: 0,
  mat_1: 0,
  mat_2: 0,
  mat_3: 0,
  mat_4: 0,
  mat_5: 0,
  prc_1: 0,
  prc_2: 0,
  prc_3: 0,
  prc_4: 0,
  prc_5: 0,
  coins: 0,
},
//all results
results = {
  actions: 0,
  exp: 0,
  proto_count: 0,
},
materials = [],
tea_slot = "",
tea_pos = 0,
temp = 0;
game_data = null;
price_data = null;
enhancable_items = null;

//tims as seconds, return string "00h:00m:00s"
function formatTime(seconds) {
  // Calculate the number of hours, minutes, and seconds
  var hours = (Math.floor(seconds / 3600)).toString()
  var minutes = (Math.floor((seconds % 3600) / 60)).toString()
  var remainingSeconds = (Math.floor(seconds % 60)).toString()

  return hours+"h, "+minutes.padStart(2, '0')+"m, "+remainingSeconds.padStart(2, '0')+"s"
}

// Update enhancer traits that built off of given inputs
function update_values() {
  // Enhancer bonus
  console.log(save_data, sim_data);
  key = "/items/" + save_data.selected_enhancer.substring(4);
	save_data.enhancer_level = Number($("#i_enhancer_level").val())
	temp = enhancable_items.find((a) => a.hrid == key).equipmentDetail.noncombatStats.enhancingSuccess * 100 * enhance_bonus[save_data.enhancer_level]
	enhancer_bonus = Number(temp.toFixed(2))

  // Total bonus
  effective_level = save_data.enhancing_level + (save_data.tea_enhancing ? 3 : 0) + (save_data.tea_super_enhancing ? 6 : 0);
	if(effective_level >= sim_data.item_level)
		sim_data.total_bonus = 1+(0.05*(effective_level + save_data.laboratory_level - sim_data.item_level)+enhancer_bonus)/100
	else
		sim_data.total_bonus = (1-(0.5*(1-(effective_level) / sim_data.item_level)))+((0.05*save_data.laboratory_level)+enhancer_bonus)/100
  $("#o_success_bonus").text(((sim_data.total_bonus - 1.0) * 100).toFixed(2) + "%");

  // Action time
  //save_data.enchanted_level = Number($("#i_enchanted_level").val());
  temp = enhancable_items.find((a) => a.hrid == "/items/enchanted_gloves").equipmentDetail.noncombatStats.enhancingSpeed * 100 * enhance_bonus[save_data.enchanted_level]
  glove_bonus = save_data.use_enchanted ? Number(temp.toFixed(2)) : 0.0;
	temp = (12/(1+(save_data.enhancing_level>sim_data.item_level ? ((effective_level+save_data.laboratory_level-sim_data.item_level)+glove_bonus)/100 : (save_data.laboratory_level+glove_bonus)/100))).toFixed(2)
	$("#o_action_speed").text(temp + "s")
	sim_data.attempt_time = Number(temp)

	localStorage.setItem("Enhancelator", JSON.stringify(save_data))
	reset_results()
}

function validate_field(id, key, value, min, max) {
	min = Number(min)
	max	= Number(max)
  if(value == "")
  { 
    value = Number($("#"+id).attr("placeholder"));
    if(key in save_data) { save_data[key] = value; }
    if(key in sim_data)  { sim_data [key] = value; }
    update_values();
    return;
  }
  value = Number(value);


  if(value < min)      { value = min; }
  else if(value > max) { value = max; }
  
  $("#"+id).val(value)
  if(key in save_data) { save_data[key] = value; }
  if(key in sim_data)  { sim_data [key] = value; }

  console.log(id, key, value, save_data);
	update_values()
}

function reset() {
	$("#protect_price_cell").css("display", "none")
	$("#gloves_level_cell").css("display", "none")
	$("#i_protect_price").val("")
	
	$(".item_slot_icon > svg > use").attr("xlink:href", "#")

	for(i = 1; i <=5; i++) {
		$("#i_mat_"+i).val("0")
		$("#i_prc_"+i).val("")
		$("#mat_"+i+"_cell").css("display", "none")
	}
	$("#iterations").text("0")
	$("#i_coins").val("0")
	materials = []
	close_sel_menus()
	update_values()
}

function close_sel_menus() {
	$("#item_filter").val("")
	$("#sel_item_container").css("display", "none")
}

//changing any value will change avg, so it must be reseted
function reset_results() {
	$("#used_proto_cell").css("display", "none")
	for(i = 1; i <=5; i++) {
		$("#r_mat_"+i+"_cell").css("display", "none")
	}
  
  var tbodyRef = document.getElementById('myTable').getElementsByTagName('tbody')[0];
  while(tbodyRef.rows.length > 0) { tbodyRef.deleteRow(0); }

  const protect_levels = [...Array(save_data.stop_at - 1).keys()].map((x, i) => i + 2);
  all_results = protect_levels.map((a) => { sim_data.protect_at = a; return Enhancelate(save_data, sim_data); });

  const base_price = ($("#i_base_price").val() == "") ? Number($("#i_base_price").attr("placeholder")) : Number($("#i_base_price").val());

  all_results = all_results.map((a) => {
    a.mat_cost = 
      sim_data.mat_1 * a.actions * sim_data.prc_1 +
      sim_data.mat_2 * a.actions * sim_data.prc_2 +
      sim_data.mat_3 * a.actions * sim_data.prc_3 +
      sim_data.mat_4 * a.actions * sim_data.prc_4 +
      sim_data.mat_5 * a.actions * sim_data.prc_5 +
      sim_data.protect_price * a.protect_count +
      sim_data.coins * a.actions;
    a.ttl_cost = (base_price + a.mat_cost + save_data.hourly_rate * sim_data.attempt_time * a.actions / 3600) * (save_data.percent_rate / 100.0 + 1.0);
    return a;
  });
  
  const min_mat_cost = all_results.reduce((min, elm) => elm.mat_cost < min ? elm.mat_cost : min, 999999999999999);
  const min_ttl_cost = all_results.reduce((min, elm) => elm.ttl_cost < min ? elm.ttl_cost : min, 999999999999999);

  for(let protect_at = 2; protect_at <= save_data.stop_at; protect_at++)
  {
    result = all_results[protect_at - 2];
    
    var newRow = tbodyRef.insertRow();
    //console.log(all_results[protect_at-2].mat_cost, min_mat_cost);
    if(result.mat_cost == min_mat_cost) { newRow.style.backgroundColor = "#223355"; }
    if(result.ttl_cost == min_ttl_cost) { newRow.style.backgroundColor = "#224422"; }
    var newText = null;

    function AddNumberCell(num, rounding) {
      if(rounding == null) rounding = 0;
      const options = {minimumFractionDigits: rounding, maximumFractionDigits: rounding};
      newText = document.createTextNode(Number(Number.parseFloat(num)).toLocaleString(undefined, options));
      newCell = newRow.insertCell();
      newCell.className = 'results_data_cells';
      newCell.appendChild(newText);
    };

    AddNumberCell(protect_at);
    AddNumberCell(result.actions);

    newText = document.createTextNode(formatTime(sim_data.attempt_time * result.actions));
    newCell = newRow.insertCell();
    newCell.className = 'results_data_cells';
    newCell.appendChild(newText);
    
    // Exp metrics
    AddNumberCell(result.exp);
    AddNumberCell(result.exp/(sim_data.attempt_time * result.actions / 3600));
    AddNumberCell(result.mat_cost / result.exp);

    // materials and costs
    if(sim_data.mat_1 > 0) { AddNumberCell(sim_data.mat_1 * result.actions); }
    if(sim_data.mat_2 > 0) { AddNumberCell(sim_data.mat_2 * result.actions); }
    if(sim_data.mat_3 > 0) { AddNumberCell(sim_data.mat_3 * result.actions); }
    if(sim_data.mat_4 > 0) { AddNumberCell(sim_data.mat_4 * result.actions); }
    if(sim_data.mat_5 > 0) { AddNumberCell(sim_data.mat_5 * result.actions); }
    AddNumberCell(sim_data.coins * result.actions);
    AddNumberCell(result.protect_count, 2);
    AddNumberCell(result.mat_cost);
    AddNumberCell(result.ttl_cost);
  }
}

function change_item(value, key) {
	reset()
  save_data.selected_item = key;

	$(".item_slot_icon > svg > use").attr("xlink:href", "#"+value)
	$("#sel_item_container").css("display", "none")

	$("#proto_price_cell").css("display", "flex")
	$("#i_protect_price").val("")
  $("#i_base_price").val("");

  sim_data.protect_1_hrid = "/items/mirror_of_protection";
  sim_data.protect_2_hrid = "";
  sim_data.protect_3_hrid = "";
  sim_data.protect_4_hrid = "";
  sim_data.protect_5_hrid = "";
  $("#r_mat_1_icon > svg > use").attr("xlink:href", "#");
  $("#r_mat_2_icon > svg > use").attr("xlink:href", "#");
  $("#r_mat_3_icon > svg > use").attr("xlink:href", "#");
  $("#r_mat_4_icon > svg > use").attr("xlink:href", "#");
  $("#r_mat_5_icon > svg > use").attr("xlink:href", "#");
  $("#r_mat_1_icon").css("display", "none");
  $("#r_mat_2_icon").css("display", "none");
  $("#r_mat_3_icon").css("display", "none");
  $("#r_mat_4_icon").css("display", "none");
  $("#r_mat_5_icon").css("display", "none");
  $("#prot_3_icon").css("display", "none");
  $("#prot_4_icon").css("display", "none");
  $("#prot_5_icon").css("display", "none");
  $("#prot_1_icon").attr("class", "btn_icon");
  $("#prot_2_icon").attr("class", "btn_icon");
  $("#prot_3_icon").attr("class", "btn_icon");
  $("#prot_4_icon").attr("class", "btn_icon");
  $("#prot_5_icon").attr("class", "btn_icon");
  sim_data.mat_1 = sim_data.mat_2 = sim_data.mat_3 = sim_data.mat_4 = sim_data.mat_5 = 0;
  sim_data.prc_1 = sim_data.prc_2 = sim_data.prc_3 = sim_data.prc_4 = sim_data.prc_5 = 0;

	materials = []
  const item = enhancable_items.find((a) => a.hrid == key);
	for(i = 0; i < item.enhancementCosts.length; i++) {
		elm = item.enhancementCosts[i]
		if(elm.itemHrid == "/items/coin") {
			$("#i_coins").text(elm.count)
			sim_data.coins = elm.count
		}
		else {
			materials.push(elm.itemHrid)
			$("#mat_"+(i+1)+"_cell").toggle();
			$("#r_mat_"+(i+1)+"_cell").toggle();
			$("#mat_"+(i+1)+"_icon > svg > use").attr("xlink:href", "#"+elm.itemHrid.substring(7))
			$("#r_mat_"+(i+1)+"_icon > svg > use").attr("xlink:href", "#"+elm.itemHrid.substring(7))
      $("#r_mat_"+(i+1)+"_icon").css("display", "")
			$("#i_mat_"+(i+1)).text(elm.count)
			sim_data["mat_"+(i+1)] = elm.count
      const fullName = game_data.itemDetailMap[elm.itemHrid].name;
      const material_price_data = price_data.market[fullName];
      const final_material_cost = (material_price_data.ask + material_price_data.bid) / 2.0;
      $("#i_prc_"+(i+1)).attr("placeholder", final_material_cost);
      sim_data["prc_"+(i+1)] = final_material_cost;
		}
	}

  // mirror
  let min_cost = get_full_item_price("/items/mirror_of_protection");
  sim_data.protect_element_id = "#prot_1_icon";

  // base item
  let protect_item_hrids = item.protectionItemHrids == null ? [item.hrid] : [item.hrid].concat(item.protectionItemHrids);

  // base item + protect options
  protect_item_hrids.forEach((protection_hrid, i) =>
  {
    sim_data["protect_" + (i + 2) + "_hrid"] = protection_hrid;

    const this_cost = get_full_item_price(protection_hrid);
    if(i == 0) { base_price = this_cost; }
    if(this_cost < min_cost)
    {
      min_cost = this_cost;
      sim_data.protect_element_id = "#prot_" + (i+2) + "_icon";
    }
    $("#prot_" + (i+2) + "_icon").css("display", "inline-block");
    $("#prot_" + (i+2) + "_icon > svg > use").attr("xlink:href", "#"+protection_hrid.substring(7));
  });
  
  $("#i_protect_price").attr("placeholder", min_cost);
  sim_data.protect_price = min_cost;

  $("#base_icon > svg > use").attr("xlink:href", "#"+item.hrid.substring(7));
  $("#i_base_price").attr("placeholder", base_price);
  $(sim_data.protect_element_id).attr("class", "btn_icon_selected");

	sim_data.item_level = item.itemLevel
	enhancable_items.forEach(function(item, index) {
		key = item.hrid.substring(7);
	  $("#"+key+"_list").css("display", "flex")
	});
	update_values();
}

function filter() {
	temp = $("#item_filter").val().toLowerCase()
	if(temp != "") {
    enhancable_items.forEach(function(item) {
      key = item.hrid.substring(7);
      if(key.includes(temp))
        $("#"+key+"_list").css("display", "flex")
      else
        $("#"+key+"_list").css("display", "none")
    })
  } else {
    enhancable_items.forEach(function(item) {
      key = item.hrid.substring(7);
      $("#"+key+"_list").css("display", "flex")
    })
  }
}

function init_user_data() {
	if(localStorage.getItem("Enhancelator")) {
		save_data = JSON.parse(localStorage.getItem("Enhancelator"));
		$("#i_enhancing_level").val(save_data.enhancing_level);
		$("#i_laboratory_level").val(save_data.laboratory_level);
    $("#i_enhancer_level").val(save_data.enhancer_level);
    $("#i_use_enchanted").prop("checked", save_data.use_enchanted)
		$("#i_enchanted_level").val(save_data.enchanted_level);

    if(save_data.tea_enhancing)       { $("#tea_enhancing").attr("class", "btn_icon_selected"); }
    if(save_data.tea_super_enhancing) { $("#tea_super_enhancing").attr("class", "btn_icon_selected"); }
    if(save_data.tea_blessed)         { $("#tea_blessed").attr("class", "btn_icon_selected"); }
    if(save_data.tea_wisdom)          { $("#tea_wisdom").attr("class", "btn_icon_selected"); }

    $("#i_stop_at").val(save_data.stop_at);

    if($("#i_hourly_rate").attr("placeholder") != save_data.hourly_rate) { $("#i_hourly_rate").val(save_data.hourly_rate); }
    if($("#i_precent_rate").attr("placeholder") != save_data.precent_rate) { $("#i_precent_rate").val(save_data.precent_rate); }

    i_stop_at.addEventListener('focus', () => i_stop_at.select());
	}
  
  if(save_data.selected_item == null || save_data.selected_item == "")
  {
    save_data.selected_item = "/items/snake_fang_dirk";
  }  
  change_item(save_data.selected_item.substring(7), save_data.selected_item);

  if($("#" + save_data.selected_enhancer) == null) { save_data.selected_enhancer = "btn_holy_enhancer"; }
  $("#" + save_data.selected_enhancer).attr("class", "btn_icon_selected");
}

function enhancer_selection(element)
{
  $("#" + save_data.selected_enhancer).attr("class", "btn_icon");
  save_data.selected_enhancer = element.id;
  console.log("clickey enhancery!");
  console.log(element);
  element.className = 'btn_icon_selected';

  update_values();
}

function tea_selection(element)
{
  if(element.className == "btn_icon")
  {
    element.className = "btn_icon_selected";
    if(element.id == "tea_enhancing") { $("#tea_super_enhancing").attr("class", "btn_icon"); save_data.tea_super_enhancing = false;}
    if(element.id == "tea_super_enhancing") { $("#tea_enhancing").attr("class", "btn_icon"); save_data.tea_enhancing = false;}
    save_data[element.id] = true;
  }
  else
  {
    element.className = "btn_icon";
    save_data[element.id] = false;
  }

  update_values();
  reset_results();
}

function protect_selection(element)
{
  const index = Number(element.id.substring(5, 6));
  $(sim_data.protect_element_id).attr("class", "btn_icon");
  element.className = "btn_icon_selected";
  let new_cost = get_full_item_price(sim_data["protect_" + index + "_hrid"]);
  $("#i_protect_price").attr("placeholder", new_cost);
  sim_data.protect_price = new_cost;
  sim_data.protect_element_id = "#" + element.id;

  update_values();
  reset_results();
}

$(document).ready(function() {
	window.scrollTo(0, 1)
  
  const pricesRequest = new XMLHttpRequest();
  pricesRequest.open("GET", "https://holychikenz.github.io/MWIApi/milkyapi.json", false);
  pricesRequest.send(null);
  console.log(pricesRequest);
  price_data = JSON.parse(pricesRequest.responseText);
  console.log(price_data);

  const request = new XMLHttpRequest();
  request.open("GET", "init_client_info.json", false);
  request.send(null);
  console.log(request);
  game_data = JSON.parse(request.responseText);

	//generte items list
  enhancable_items = Object.entries(game_data.itemDetailMap).reduce((acc, cur) => {
    if(cur[1].enhancementCosts != null) { acc.push(cur[1]); }
    return acc;
  }, []).sort((a, b) => a.sortIndex - b.sortIndex);

	init_user_data();
	update_values();

  enhancable_items.forEach(function(item) {
    key = item.hrid.substring(7); // remove "/items/"
    $("#sel_item").append('<div id="'+key+'_list" value="'+key+'" data="'+item.hrid+'" class="sel_item_div"><svg><use xlink:href="#'+key+'"></svg></use></div>')
	})

	//generte ehancers items list
  let enhancers = enhancable_items.filter((a) => a.equipmentDetail.type == "/equipment_types/enhancing_tool");
	enhancers.forEach(function(item) {
    key = item.hrid.substring(7); // remove "/items/"
		$("#enhancer_item").append('<div id="'+key+'_enhance" value="'+key+'" data="'+item.hrid+'" class="sel_item_div"><svg><use xlink:href="#'+key+'"></svg></use></div>')
	})

  $("#i_use_enchanted").on("input", function() {
		save_data.use_enchanted = $("#i_use_enchanted").prop('checked')
		update_values()
  })

	$("#item_slot").on("click", ".item_slot_icon", function() {
		temp = $("#sel_item_container").css("display")
		$("#sel_item_container").css("display", temp == "flex" ? "none":"flex")
	})

  $("#item_filter").on("input", function() {
  	filter()
  })

  $("#sel_item").on("click", ".sel_item_div", function() {
    console.log("wat");
  	change_item($(this).attr("value"), $(this).attr("data"))
  	update_values()
  })

  $("input[type='number']").on("input", function() {
  	validate_field($(this)[0].id, $(this)[0].id.replace("i_", ""), $(this)[0].value, $(this)[0].min, $(this)[0].max)
	})
})
