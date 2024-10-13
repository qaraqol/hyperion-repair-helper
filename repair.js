import { $ } from "bun";
import amqp from "amqplib";
//Must have a missing.json and the first batch (start, end) should be specified,
//It should be in the below pattern so the ./hyp-repair can read it
//[{ "start": 330002000, "end": 330002000 }]
//For the repair tool to work, you need to remove two lines from hyp-repair.js, line #668 and #669:
// process.stdout.clearLine(0);
// process.stdout.cursorTo(0);
const config = {
  batch: 1500, //how many blocks should be repaired each time the program restarts
  end: 329173500, //when to finish repairing blocks
  queueName: "wax:ds_pool:1",
  amqHost: "localhost",
  amqUser: "",
  amqPass: "",
  vhost: "hyperion",
  interval: 60000, //interval to recheck the rabbitmq queues and rerun the program in ms.
};

const file = Bun.file(`missing.json`);
const range = await file.json();

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

    // If there are fewer than 5 messages in the queue, run the repair
    if (messageCount < 5 && range[0].start < config.end) {
      range[0].start += config.batch;
      range[0].end += config.batch;
      console.log("****\nStarting a new repair job...");
      console.log("Current Range: " + range[0].start + " - " + range[0].end); //Current range being repaired
      await $`./hyp-repair fill-missing wax missing.json`; //Run the repair command
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

checkQueueAndRepair();
