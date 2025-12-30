import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Reconciliation {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @CreateDateColumn()
    timestamp!: Date;

    @Column("json")
    summary!: {
        totalReconciliado: number;
        totalApenasBanco: number;
        totalApenasContabilidade: number;
        valorReconciliado: number;
        valorApenasBanco: number;
        valorApenasContabilidade: number;
    };

    @Column("json")
    data: any; // Stores the full result object including lists

    @Column({ default: false })
    tratado!: boolean;

    @Column({ nullable: true })
    name!: string;
}
