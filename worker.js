function sim_cost(
    success_chances,
    step_price,
    protect_price,
    protect_at,
    stop_at,
    use_blessed,
    guzzling_bonus,
) {
    let current_level = 0;
    let actions = 0;
    let protects = 0;
    let cost = 0;
    while(current_level < stop_at) {
      const prob = success_chances[current_level];
      if (Math.random() < prob) {
        cost += step_price;
        if (use_blessed && Math.random() < 0.01 * guzzling_bonus) {
            current_level += 2;
        } else {
            current_level++;
        }
      } else {
        cost += step_price;
        if (current_level >= protect_at) {
          cost += protect_price;
          current_level--;
          protects++;
        } else {
          current_level = 0;
        }
      }
      actions++;
    }
    return { cost, actions, protects };
}

onmessage = function(e) {
    const result = sim_cost(
        e.data.success_chances,
        e.data.step_price,
        e.data.protect_price,
        e.data.protect_at,
        e.data.stop_at,
        e.data.use_blessed,
        e.data.guzzling_bonus,
    );
    postMessage(result);
}