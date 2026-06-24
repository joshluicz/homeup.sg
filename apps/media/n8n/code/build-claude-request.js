const input = $input.first().json;

const userMessage = `This property is located at: ${input.address}. Do not reference any other location.

Generate a production blueprint for this property tour video.

PROPERTY DETAILS:
Address: ${input.address}
Type: ${input.property_type}
Rooms: ${input.rooms}
Size: ${input.sqft} sqft
Price range: ${input.price_range}
Selling points: ${input.selling_points}
Renovation status: ${input.renovation_status}
Agent notes: ${input.agent_notes || "None"}

ROOM PHOTOS (each will become an animated B-roll clip):
${input.room_list}

TIMING: Each room segment should target ~${input.seconds_per_room} seconds of presenter speech (~${input.words_per_room} words per room).`;

return [
  {
    json: {
      ...input,
      anthropic_body: {
        model: "claude-sonnet-4-6",
        max_tokens: 3000,
        system: [
          {
            type: "text",
            text: __BLUEPRINT_SYSTEM_PROMPT__,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content: userMessage }],
      },
    },
  },
];
