const iona=text=>({voice:'iona',who:'Iona',text});
export const MESSAGE_LINES={
 'messages-goal':iona('These messages have waited in the archive. Help me send all the messages aboard. A full crate has no empty slots. Capacity means the most it can hold. First plan the full crates, then what is left, then the smallest total we need.'),
 'maps-goal':iona('The chart room has maps to protect. Each case has a limit. Plan the full cases, the maps left over, and the smallest total of cases that will protect every map.'),
 'messages-example':iona('Here is a different bundle of twenty messages. Each crate holds six. Three full crates hold eighteen. Two messages remain, so they need one more crate. Four crates send every message. Three times six plus two is twenty.'),
 'messages-step':iona('Multiply your full groups by the capacity. Take that many away from the total to find the remainder. The remainder must be smaller than the capacity. If anything remains, it needs space too. If nothing remains, do not add another container.'),
 'messages-work-47':iona('Seven times six is forty two. Forty seven minus forty two leaves five. Seven full crates and one partly filled crate make eight crates. Every message can go aboard. We will load this plan together.'),
 'messages-work-53':iona('Eight times six is forty eight. Fifty three minus forty eight leaves five. Eight full crates and one partly filled crate make nine crates. We will load this plan together.'),
 'messages-work-48':iona('Eight times six is forty eight. Nothing is left over. Exactly eight crates are needed, with no extra crate. We will load this plan together.'),
 'messages-work-38':iona('Four times eight is thirty two. Thirty eight minus thirty two leaves six maps. Four full cases and one partly filled case make five cases. We will pack this plan together.'),
 'messages-jam':iona('The loading rail is held. Every item is safe. Unload the rail once, then revise the plan. We have sent nothing away.'),
 'messages-done':iona('Every item has a place within the limit. The plan is ready. Thank you for giving these words a way out of the harbour.')
};
