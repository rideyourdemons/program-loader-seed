export default async function run() {
  console.log("Example program loaded and running.");
  
  // Example of async work
  await new Promise(resolve => setTimeout(resolve, 100));
  
  console.log("Example program initialization complete.");
  
  // Program can continue running here
  // or return if it's a one-time operation
}
