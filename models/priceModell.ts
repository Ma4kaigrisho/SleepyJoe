import { DB } from "../core/db";
import {DepositModel} from "./depositModel";

export class PriceModell {
    private conn
    constructor() {
        this.conn = new DB().conn
    }

    async getPrice(crypto_name:string){
        const price = await this.conn.query("SELECT value_usdt FROM prices WHERE crypto_name=?",[crypto_name]);
        return price;
    }
    async getCryptos(){
        const [rows] = await this.conn.query("SELECT * FROM prices");
        return rows;
    }
    async deposit(depositModel:DepositModel) {
        const conn = await this.conn.getConnection();
        try {
            await conn.beginTransaction(); // start transaction
            const [usdt] = await conn.query("SELECT amount FROM wallet_contents WHERE crypto_id=? AND public_address=?", [4, depositModel.public_address]);

            if (usdt.length != 0) { //already have usdt in the account
                await conn.execute("UPDATE wallet_contents SET amount = amount+? WHERE public_address=? AND crypto_id=?", [depositModel.deposit_amount, depositModel.public_address, 4]);
            } else {
                await conn.execute("INSERT INTO wallet_contents (public_address,crypto_id,amount) VALUES (?, ?, ?)", [depositModel.public_address, 4, depositModel.deposit_amount]);
            }

            await conn.commit(); // commit transaction
        } catch (err) {
            await conn.rollback(); // rollback transaction on error
            throw err;
        } finally {
            conn.release(); // release connection
        }
    }
}
