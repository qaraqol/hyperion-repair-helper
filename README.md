# hyperion-repair-helper

This script is designed to reindex and repair missing blocks or blocks with missing transactions for the Hyperion History. It checks RabbitMQ queues and runs a repair job for the specified range of blocks using the hyp-repair tool.
Prerequisites

Before running the script, ensure the following:

You have Bun installed on your system. If not, install it from Bun's official website.
The amqplib package is installed. You can add it via Bun:

`bun add amqplib`

The hyp-repair script is available and correctly configured.
RabbitMQ is running, and you have the necessary credentials for accessing it.
The missing.json file exists in the specified format:

```json
[{ "start": 330002000, "end": 330002000 }]
```

##Setup
Modify hyp-repair.js

To ensure compatibility with this script, you need to remove the following two lines (found in line #668 and #669) from the hyp-repair.js file:

```javascript
process.stdout.clearLine(0);
process.stdout.cursorTo(0);
```

These lines can cause errors when running the script under certain conditions.
Configure the Script

Edit the config object in the script to match your environment:

```javascript
const config = {
  batch: 1500, // Number of blocks to repair per batch
  end: 329173500, // When to finish repairing blocks
  queueName: "wax:ds_pool:1", // RabbitMQ queue name
  amqHost: "localhost", // RabbitMQ hostname or IP
  amqUser: "", // RabbitMQ username
  amqPass: "", // RabbitMQ password
  vhost: "hyperion", // RabbitMQ virtual host
  interval: 60000, // Interval to recheck queues in milliseconds
};
```

Ensure that batch and end are set according to the blocks you wish to repair.
Running the Script

Run the script using Bun:

```bash

bun run repair.js
```

##What the Script Does

Queue Check: It connects to RabbitMQ to check the specified queue. If there are fewer than 5 messages, the script proceeds to start a repair job.
Block Repair: The hyp-repair tool is executed with the fill-missing command, using missing.json as the source for block ranges.
Range Update: After each repair job, the missing.json file is updated with the new block range.
Queue Monitoring: The script continues to monitor the RabbitMQ queue, waiting for it to be less busy before starting new repair jobs.
Completion: When the specified block range is finished, the script exits.

##Important Notes

Ensure that the queue name and other RabbitMQ connection details are correctly set.
The script will run continuously, checking the queue and performing repair jobs until the specified end block is reached.
Adjust the batch size to suit your performance requirements. A larger batch will repair more blocks at once but may take longer to complete each job.

Example of missing.json Format

```json mssing.json
[{ "start": 330002000, "end": 330002000 }]
```

The script increments the start and end fields with each batch of blocks it repairs.
License

This project is licensed under the MIT License - see the LICENSE file for details.

##Tutorial/Guides

Bun Setup: To set up Bun, visit the [Bun documentation](https://bun.sh/docs).
Hyperion Setup: To set up Hyperion, refer to their official documentation on [Hyperion GitHub](https://github.com/eosrio/Hyperion-History-API).
