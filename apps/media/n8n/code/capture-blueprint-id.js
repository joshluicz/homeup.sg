const supabaseResult = $input.first().json;
const blueprintId = supabaseResult.id;

if (!blueprintId) {
  throw new Error(
    "Supabase did not return a blueprint ID. Response: " +
      JSON.stringify(supabaseResult).substring(0, 300),
  );
}

const parsed = $("Parse Blueprint JSON").first().json;

return [
  {
    json: {
      ...parsed,
      blueprint_id: blueprintId,
    },
  },
];
