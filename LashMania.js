export default {
  async fetch(request, env, ctx) {
    const { eventsTech1, eventsTech2, duration, dateToCheck, dayOfWeek } = await request.json();

    const workingHours = {
      monday: { start: "08:00", end: "19:00" },
      tuesday: { start: "08:00", end: "19:00" },
      wednesday: { start: "08:00", end: "19:00" },
      thursday: { start: "08:00", end: "19:00" },
      friday: { start: "08:00", end: "19:00" },
      saturday: { start: "10:00", end: "18:00" },
      sunday: null
    };

    const parseTime = (timeStr, date) => new Date(`${date}T${timeStr}:00`);

    const generateTimeSlots = (busyEvents, durationMin, date, day) => {
      const hours = workingHours[day];
      if (!hours) return [];

      const start = parseTime(hours.start, date);
      const end = parseTime(hours.end, date);

      const freeSlots = [];
      const busy = busyEvents
        .map(e => ({
          start: new Date(e.start),
          end: new Date(e.end)
        }))
        .sort((a, b) => a.start - b.start);

      let pointer = new Date(start);

      for (let b of busy) {
        if (pointer.getTime() + durationMin * 60000 <= b.start.getTime()) {
          freeSlots.push({
            start: new Date(pointer),
            end: new Date(pointer.getTime() + durationMin * 60000)
          });
        }
        if (pointer < b.end) pointer = new Date(b.end);
      }

      while (pointer.getTime() + durationMin * 60000 <= end.getTime()) {
        freeSlots.push({
          start: new Date(pointer),
          end: new Date(pointer.getTime() + durationMin * 60000)
        });
        pointer = new Date(pointer.getTime() + 5 * 60000); // optional 5min step
      }

      return freeSlots;
    };

    const slots1 = generateTimeSlots(eventsTech1, duration, dateToCheck, dayOfWeek);
    const slots2 = generateTimeSlots(eventsTech2, duration, dateToCheck, dayOfWeek);

    const pickBalanced = (s1, s2) => {
      const combined = [];

      const min = Math.min(s1.length, s2.length);
      for (let i = 0; i < min; i++) {
        combined.push({ tech: "LashMania 1", ...s1[i] });
        combined.push({ tech: "LashMania 2", ...s2[i] });
      }
      for (let i = min; i < s1.length; i++) {
        combined.push({ tech: "LashMania 1", ...s1[i] });
      }
      for (let i = min; i < s2.length; i++) {
        combined.push({ tech: "LashMania 2", ...s2[i] });
      }
      return combined;
    };

    const balancedSlots = pickBalanced(slots1, slots2).slice(0, 6); // top 6 options max

    return new Response(JSON.stringify({ available_slots: balancedSlots }), {
      headers: { "content-type": "application/json" }
    });
  }
}
