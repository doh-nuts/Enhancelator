
let success_rate = [
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
]

function cal_exp(item_level, enhance_level) {
  return 1.4*(1+enhance_level)*(10+item_level)
}

function Enhancelate(save_data, sim_data)
{
  let markov = math.zeros(20,20);
  const success_chances = success_rate.map((a) => a / 100.0 * sim_data.total_bonus);

  for(let i = 0; i < save_data.stop_at; i++)
  {
    const success_chance = (success_rate[i] / 100.0) * sim_data.total_bonus;
    const destination = i >= sim_data.protect_at ? i - 1 : 0;
    if(save_data.tea_blessed)
    {
      markov.set([i, i+2], success_chance * 0.01);
      markov.set([i, i+1], success_chance * 0.99);
      markov.set([i, destination], 1 - success_chance);
    }
    else
    {
      markov.set([i, i+1], success_chance);
      markov.set([i, destination], 1.0 - success_chance);
    }
  }
  markov.set([save_data.stop_at, save_data.stop_at], 1.0);
  //console.log(markov);

  let Q = markov.subset(math.index(math.range(0, save_data.stop_at), math.range(0, save_data.stop_at)));
  //console.log(Q);
  const M = math.inv(math.subtract(math.identity(save_data.stop_at), Q));
  //console.log(M);
  const attemptsArray = M.subset(math.index(math.range(0, 1), math.range(0, save_data.stop_at)));
  //console.log(attemptsArray);
  const attempts = math.flatten(math.row(attemptsArray, 0).valueOf()).reduce((a, b) => a + b, 0);
  //console.log(attempts);
  const protectAttempts = M.subset(math.index(math.range(0, 1), math.range(sim_data.protect_at, save_data.stop_at)));
  //console.log(protectAttempts);
  const protectAttemptsArray = (typeof protectAttempts === 'number') ?
     [protectAttempts] :
     math.flatten(math.row(protectAttempts, 0).valueOf());
  //console.log(protectAttemptsArray);
  //console.log(protectAttemptsArray.map((a, i) => a * markov.get([i + sim_data.protect_at, i + sim_data.protect_at - 1])));
  const protects = protectAttemptsArray.map((a, i) => a * markov.get([i + sim_data.protect_at, i + sim_data.protect_at - 1])).reduce((a, b) => a + b, 0);
  //console.log(protects);
  const exp = math.flatten(math.row(attemptsArray, 0).valueOf()).reduce((acc, a, i) => {
    console.log(acc, a, i, success_chances[i]);
    return acc + (a * success_chances[i] + a * 0.1 * (1 - success_chances[i])) * (save_data.tea_wisdom ? 1.12 : 1.00) * (cal_exp(sim_data.item_level, i));
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
    final_cost = (item_price_data.ask + item_price_data.bid) / 2.0;
  }

  return final_cost;
}


