async function checkQueueAndRepair() {
  if (range[0].end > config.end) {
    console.log("Range finished");
    return;
  } else {
    try {
      // Check queue status
      const connection = await amqp.connect({
        protocol: "amqp",
        hostname: config.amqHost,
        port: 5672,
        username: config.amqUser,
        password: config.amqPass,
        vhost: config.vhost,
      });
      const channel = await connection.createChannel();
      const queue = await channel.checkQueue(config.queueName);
      const { messageCount } = queue;

      console.log(`Messages in queue: ${messageCount}`);

      // If there are fewer than 3 messages in the queue, run the repair
      if (messageCount < 3) {
        console.log("****\nStarting a new repair job...");
        console.log("Current Range: " + range[0].start + " - " + range[0].end); //Current range being repaired
        await $`./hyp-repair fill-missing wax missing.json`; //Run the repair command
        range[0].start += config.batch;
        range[0].end += config.batch;
        await Bun.write(file, JSON.stringify(range, null, 2)); //Update the missing.json file with the last repaired range

        setTimeout(checkQueueAndRepair, config.interval);
      } else if (messageCount >= 5) {
        console.log("Queue is busy. Waiting to retry...");
        setTimeout(checkQueueAndRepair, config.interval);
      }
      await channel.close();
      await connection.close();
    } catch (error) {
      console.error("Error:", error);
    }
  }
}
