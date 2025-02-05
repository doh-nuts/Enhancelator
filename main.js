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
  enhancing_level: 100,
  observatory_level: 0,
  enhancer_level: 0,
  selected_enhancer: "btn_cheese_enhancer",
  use_enchanted: false,
  use_guzzling: false,
  use_enhancer_top: false,
  use_enhancer_bot: false,
  enchanted_level: 0,
  guzzling_level: 0,
  enhancer_top_level: 0,
  enhancer_bot_level: 0,

  tea_enhancing: false,
  tea_super_enhancing: false,
  tea_ultra_enhancing: false,
  tea_blessed: false,
  tea_wisdom: false,

  selected_item: "",
  stop_at: 10,

  hourly_rate: 3000000,
  percent_rate: 2,
},
sim_data = {
  item_level: 100,
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
temp = 0;
game_data = null;
price_data = null;
enhancable_items = null,

success_rate = [
  50, //+1
  45, //+2
  45, //+3
  40, //+4
  40, //+5
  40, //+6
  35, //+7
  35, //+8
  35, //+9
  35, //+10
  30, //+11
  30, //+12
  30, //+13
  30, //+14
  30, //+15
  30, //+16
  30, //+17
  30, //+18
  30, //+19
  30 //+20
];

function cal_exp(item_level, enhance_level) {
  return 1.4*(1+enhance_level)*(10+item_level)
}

function Enhancelate(save_data, sim_data)
{
  let markov = math.zeros(20,20);
  const success_chances = success_rate.map((a) => a / 100.0 * sim_data.total_bonus);

  const use_t95 = $("#i_use_t95").prop('checked');
  const t95_round_up = $("#i_t95_round_up").prop('checked');
  const t95_chance = Number($("#i_t95_chance").val()) / 100.0;

  for(let i = 0; i < save_data.stop_at; i++)
  {
    const success_chance = (success_rate[i] / 100.0) * sim_data.total_bonus;
    let remaining_success_chance = success_chance;
    let remaining_fail_chance = 1.0 - success_chance;
    const destination = i >= sim_data.protect_at ? i - 1 : 0;

    if(save_data.tea_blessed)
    {
      markov.set([i, i+2], success_chance * 0.01 * guzzling_bonus);
      remaining_success_chance *= 1 - 0.01 * guzzling_bonus;
    }
    if(use_t95 && i >= 2 && i < sim_data.protect_at)
    {
      const dest = t95_round_up ? Math.ceil(i/2) : Math.floor(i/2);
      markov.set([i, dest], remaining_fail_chance * t95_chance);
      remaining_fail_chance *= (1.0 - t95_chance);
    }

    markov.set([i, i+1], remaining_success_chance);
    markov.set([i, destination], remaining_fail_chance);
  }
  markov.set([save_data.stop_at, save_data.stop_at], 1.0);

  
  let Q = markov.subset(math.index(math.range(0, save_data.stop_at), math.range(0, save_data.stop_at)));
  const M = math.inv(math.subtract(math.identity(save_data.stop_at), Q));
  const attemptsArray = M.subset(math.index(math.range(0, 1), math.range(0, save_data.stop_at)));
  const attempts = math.flatten(math.row(attemptsArray, 0).valueOf()).reduce((a, b) => a + b, 0);
  const protectAttempts = M.subset(math.index(math.range(0, 1), math.range(sim_data.protect_at, save_data.stop_at)));
  const protectAttemptsArray = (typeof protectAttempts === 'number') ?
     [protectAttempts] :
     math.flatten(math.row(protectAttempts, 0).valueOf());
  const protects = protectAttemptsArray.map((a, i) => a * markov.get([i + sim_data.protect_at, i + sim_data.protect_at - 1])).reduce((a, b) => a + b, 0);
  const exp = math.flatten(math.row(attemptsArray, 0).valueOf()).reduce((acc, a, i) => {
    key = "/items/" + save_data.selected_enhancer.substring(4);
    save_data.enhancer_level = Number($("#i_enhancer_level").val());
    baseEnhancingExperience = enhancable_items.find((a) => a.hrid == key).equipmentDetail.noncombatStats.enhancingExperience;
    enhancingExperience = baseEnhancingExperience == undefined ? 0.0 : baseEnhancingExperience * enhance_bonus[save_data.enhancer_level];
    exp_bonus = (save_data.tea_wisdom ? 0.12*guzzling_bonus : 0.00) + (enhancingExperience == undefined ? 0.00 : enhancingExperience);
    return acc + (a * success_chances[i] + a * 0.1 * (1 - success_chances[i])) * (1 + exp_bonus) * (cal_exp(sim_data.item_level, i));
  }, 0);
  
  results = {};
  results.actions = attempts
  results.exp = exp;
  results.protect_count = protects;

  return results;
}

function get_full_item_price(hrid) {
  final_cost = 0;
  let is_base_item = true;

  if(hrid == "/items/coin")
  {
    return 1;
  }

  // find action to make this
  if(game_data.itemDetailMap[hrid].categoryHrid == "/item_categories/equipment")
  {
    const action = Object.values(game_data.actionDetailMap).find((a) => a.function == "/action_functions/production" && a.outputItems[0].itemHrid == hrid);
    is_base_item = (action == null);
    if(!is_base_item)
    {
      action.inputItems.forEach((item) => {
        final_cost += item.count * get_full_item_price(item.itemHrid);
      });
      if(action.upgradeItemHrid != "")
      {
        final_cost += get_full_item_price(action.upgradeItemHrid);
      }
    }
  }

  if(is_base_item)
  {
    const fullName = game_data.itemDetailMap[hrid].name;
    const item_price_data = price_data.market[fullName];
    if(item_price_data == undefined)
    {
      return 0;
    }
    final_cost = (item_price_data.ask + item_price_data.bid) / 2.0;
  }

  return final_cost;
}

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
  key = "/items/" + save_data.selected_enhancer.substring(4);
	save_data.enhancer_level = Number($("#i_enhancer_level").val())
	temp = enhancable_items.find((a) => a.hrid == key).equipmentDetail.noncombatStats.enhancingSuccess * 100 * enhance_bonus[save_data.enhancer_level]
	enhancer_bonus = Number(temp.toFixed(2))

  // Guzzling bonus
  temp = enhancable_items.find((a) => a.hrid == "/items/guzzling_pouch").equipmentDetail.noncombatStats.drinkConcentration * 100 * enhance_bonus[save_data.guzzling_level]
  guzzling_bonus = save_data.use_guzzling ? Number((1+temp/100).toFixed(3)) : 1;

  //Tea speed bonus
  tea_speed_bonus = save_data.tea_enhancing ? 2*guzzling_bonus : save_data.tea_super_enhancing ? 4*guzzling_bonus : save_data.tea_ultra_enhancing ? 6*guzzling_bonus : 0;

  // Total bonus
  effective_level = save_data.enhancing_level + (save_data.tea_enhancing ? 3*guzzling_bonus : 0) + (save_data.tea_super_enhancing ? 6*guzzling_bonus : 0) + (save_data.tea_ultra_enhancing ? 8*guzzling_bonus : 0);
	if(effective_level >= sim_data.item_level)
		sim_data.total_bonus = 1+(0.05*(effective_level + save_data.observatory_level - sim_data.item_level)+enhancer_bonus)/100
	else
		sim_data.total_bonus = (1-(0.5*(1-(effective_level) / sim_data.item_level)))+((0.05*save_data.observatory_level)+enhancer_bonus)/100
  $("#o_success_bonus").text(((sim_data.total_bonus - 1.0) * 100).toFixed(2) + "%");

  // Action time
  const calc_speed = function (item_hrid, level) {
    result = enhancable_items.find((a) => a.hrid == item_hrid).equipmentDetail.noncombatStats.enhancingSpeed * 100 * enhance_bonus[level];
    return Number(result.toFixed(2));
  };
  item_bonus = (save_data.use_enchanted ? calc_speed("/items/enchanted_gloves", save_data.enchanted_level) : 0.0) + 
               (save_data.use_enhancer_top ? calc_speed("/items/enhancers_top", save_data.enhancer_top_level) : 0.0) +
               (save_data.use_enhancer_bot ? calc_speed("/items/enhancers_bottoms", save_data.enhancer_bot_level) : 0.0);
	temp = (12/(1+(save_data.enhancing_level>sim_data.item_level ? ((effective_level+save_data.observatory_level-sim_data.item_level)+item_bonus+tea_speed_bonus)/100 : (save_data.observatory_level+item_bonus+tea_speed_bonus)/100))).toFixed(2)
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

  const item = enhancable_items.find((a) => a.hrid == key);
	for(i = 0; i < item.enhancementCosts.length; i++) {
		elm = item.enhancementCosts[i]
		if(elm.itemHrid == "/items/coin") {
			$("#i_coins").text(elm.count)
			sim_data.coins = elm.count
		}
		else {
			$("#mat_"+(i+1)+"_cell").toggle();
			$("#r_mat_"+(i+1)+"_cell").toggle();
			$("#mat_"+(i+1)+"_icon > svg > use").attr("xlink:href", "#"+elm.itemHrid.substring(7))
			$("#r_mat_"+(i+1)+"_icon > svg > use").attr("xlink:href", "#"+elm.itemHrid.substring(7))
      $("#r_mat_"+(i+1)+"_icon").css("display", "")
			$("#i_mat_"+(i+1)).text(elm.count)
			sim_data["mat_"+(i+1)] = elm.count
      const final_material_cost = get_full_item_price(elm.itemHrid);
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
  if(save_data.hide_junk)
  {
    enhancable_items.forEach(function(item) {
      key = item.hrid.substring(7);
      junk_keywords = ["cheese", "verdant", "azure", "burble", "crimson", "rainbow",
        "wooden", "birch", "cedar", "purpleheart", "ginkgo", "redwood", "arcane",
        "rough", "reptile", "gobo", "beast", "umbral",
        "cotton", "linen", "bamboo", "silk", "radiant",
      ];
      is_junk = undefined != junk_keywords.find(function(item) { return key.includes(item); });
      if(is_junk)
        $("#"+key+"_list").css("display", "none")
    })
  }
}

function init_user_data() {
	if(localStorage.getItem("Enhancelator")) {
		save_data = JSON.parse(localStorage.getItem("Enhancelator"));

    // "migration" system
    if(save_data.guzzling_level == undefined) save_data.guzzling_level = 0;
    if(save_data.use_guzzling == undefined) save_data.use_guzzling = false;
    if(save_data.enhancer_top_level == undefined) save_data.enhancer_top_level = 0;
    if(save_data.use_enhancer_top == undefined) save_data.use_enhancer_top = false;
    if(save_data.enhancer_bot_level == undefined) save_data.enhancer_bot_level = 0;
    if(save_data.use_enhancer_bot == undefined) save_data.use_enhancer_bot = false;
    if(save_data.tea_ultra_enhancing == undefined) save_data.tea_ultra_enhancing = false;
    if(save_data.observatory_level == undefined && save_data.laboratory_level != undefined) save_data.observatory_level = save_data.laboratory_level;
    if(save_data.hide_junk == undefined) save_data.hide_junk = false;

    // update the UI with the saved values
		$("#i_enhancing_level").val(save_data.enhancing_level);
		$("#i_observatory_level").val(save_data.observatory_level);
    $("#i_enhancer_level").val(save_data.enhancer_level);
    $("#i_use_enchanted").prop("checked", save_data.use_enchanted)
    $("#i_use_guzzling").prop("checked", save_data.use_guzzling)
    $("#i_use_enhancer_top").prop("checked", save_data.use_enhancer_top)
    $("#i_use_enhancer_bot").prop("checked", save_data.use_enhancer_bot)
		$("#i_enchanted_level").val(save_data.enchanted_level);
    $("#i_guzzling_level").val(save_data.guzzling_level);
    $("#i_enhancer_top_level").val(save_data.enhancer_top_level);
    $("#i_enhancer_bot_level").val(save_data.enhancer_bot_level);
    $("#i_hide_junk").prop("checked", save_data.hide_junk);

    if(save_data.tea_enhancing)       { $("#tea_enhancing").attr("class", "btn_icon_selected"); }
    if(save_data.tea_super_enhancing) { $("#tea_super_enhancing").attr("class", "btn_icon_selected"); }
    if(save_data.tea_ultra_enhancing) { $("#tea_ultra_enhancing").attr("class", "btn_icon_selected"); }
    if(save_data.tea_blessed)         { $("#tea_blessed").attr("class", "btn_icon_selected"); }
    if(save_data.tea_wisdom)          { $("#tea_wisdom").attr("class", "btn_icon_selected"); }

    $("#i_stop_at").val(save_data.stop_at);

    if($("#i_hourly_rate").attr("placeholder") != save_data.hourly_rate) { $("#i_hourly_rate").val(save_data.hourly_rate); }
    if($("#i_percent_rate").attr("placeholder") != save_data.percent_rate) { $("#i_percent_rate").val(save_data.percent_rate); }

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
  element.className = 'btn_icon_selected';

  update_values();
}

function tea_selection(element)
{
  if(element.className == "btn_icon")
  {
    element.className = "btn_icon_selected";
    if(element.id == "tea_enhancing") { $("#tea_ultra_enhancing").attr("class", "btn_icon"); $("#tea_super_enhancing").attr("class", "btn_icon"); save_data.tea_ultra_enhancing = false; save_data.tea_super_enhancing = false;}
    if(element.id == "tea_super_enhancing") { $("#tea_ultra_enhancing").attr("class", "btn_icon"); $("#tea_enhancing").attr("class", "btn_icon"); save_data.tea_ultra_enhancing = false; save_data.tea_enhancing = false;}
    if(element.id == "tea_ultra_enhancing") { $("#tea_enhancing").attr("class", "btn_icon"); $("#tea_super_enhancing").attr("class", "btn_icon"); save_data.tea_super_enhancing = false; save_data.tea_enhancing = false;}
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
  price_data = JSON.parse(pricesRequest.responseText);

  const request = new XMLHttpRequest();
  request.open("GET", "init_client_info.json", false);
  request.send(null);
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
  $("#i_use_guzzling").on("input", function() {
    save_data.use_guzzling = $("#i_use_guzzling").prop('checked')
    update_values()
  })
  $("#i_use_enhancer_top").on("input", function() {
    save_data.use_enhancer_top = $("#i_use_enhancer_top").prop('checked')
    update_values()
  })
  $("#i_use_enhancer_bot").on("input", function() {
    save_data.use_enhancer_bot = $("#i_use_enhancer_bot").prop('checked')
    update_values()
  })
  $("#i_hide_junk").on("input", function() {
    save_data.hide_junk = $("#i_hide_junk").prop('checked');
    filter();
    localStorage.setItem("Enhancelator", JSON.stringify(save_data));
  });
  $("#i_t95_round_up").on("input", function() {
		update_values()
  })
  $("#i_use_t95").on("input", function() {
		update_values()
  })

  $("#info_btn").on("click", function () {
		$("#info_menu").css("display", "flex")
	})

	$("#item_slot").on("click", ".item_slot_icon", function() {
		temp = $("#sel_item_container").css("display")
		$("#sel_item_container").css("display", temp == "flex" ? "none":"flex")
    filter();
	})

  $("#item_filter").on("input", function() {
  	filter()
  })

  $("#sel_item").on("click", ".sel_item_div", function() {
  	change_item($(this).attr("value"), $(this).attr("data"))
  	update_values()
  })

  $("input[type='number']").on("input", function() {
  	validate_field($(this)[0].id, $(this)[0].id.replace("i_", ""), $(this)[0].value, $(this)[0].min, $(this)[0].max)
	})
})
