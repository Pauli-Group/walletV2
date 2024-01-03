import * as readline from 'readline';

export default function waitForEnterOrExit(): Promise<void> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise<void>((resolve) => {
        rl.question('Press Enter to continue or q to exit...', (answer) => {
            rl.close();
            if (answer.toLowerCase() === 'q') {
                process.exit(0);
            } else {
                resolve();
            }
        });
    });
}
