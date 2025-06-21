import bcrypt from "bcrypt";





const password = "22941420"; // The password you think is correct

bcrypt.hash(password, 10).then((newHash) => {
  console.log("New Hash:", newHash);

  // Now compare it immediately
  bcrypt.compare(password, newHash).then((match) => {
    console.log("Password Match (New Hash):", match ? "✅ Matched" : "❌ Not Matched");
  });
});
