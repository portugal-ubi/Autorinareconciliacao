import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from "typeorm";

@Entity()
@Index(["hash"], { unique: true }) // Prevent duplicates
export class PhcTransaction {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column("date")
    data!: string; // YYYY-MM-DD

    @Column("decimal", { precision: 12, scale: 2 })
    valor!: number;

    @Column()
    descricao!: string;

    @Column()
    hash!: string; // MD5(data + valor + descricao)

    @Column()
    arquivo_origem!: string;

    @CreateDateColumn()
    data_importacao!: Date;
}
