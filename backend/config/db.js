import mongoose from"mongoose";

const connectDB = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI,{
            dbName: "festnbreizh"
     }),
     console.log("MongoDb connecter avec succès")
    }catch (error){
        console.log("Erreur de connexion MongoDB :", error.message);
        process.exit(1);
    }
};

export default connectDB;