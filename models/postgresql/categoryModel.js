import pkg from 'pg';
const { Pool } = pkg;
import { DBConfig } from '../../DBConfig.js'
import {query} from "express";
import {roleModel} from "./roleModel.js";


const pool = new Pool(DBConfig);

export class categoryModel {

    static async getAll() {
        const { rows: categories } = await pool.query(
            'SELECT * FROM categoria'
        );
        return categories;
    }

    static async getByCategoryName({ nombre }) {
        const { rows: state } = await pool.query(
            'SELECT * FROM categoria WHERE LOWER("Nombre") = LOWER($1)',
            [nombre]
        );

        if (state.length === 0) {
            return null;
        }

        return state[0];
    }

    static async getById({ id }) {
        const { rows: category } = await pool.query(
            'SELECT * FROM categoria WHERE "idCategoria" = $1',
            [id]
        );

        if (category.length === 0) {
            return null;
        }

        return category[0];
    }

    static async create({ input }) {
        const { nombre } = input;
        try {
            const { rows: result } = await pool.query(
                'SELECT "Nombre" FROM categoria WHERE "Nombre" = $1',
                [nombre]
            );

            if (result.length > 0) {
                return false;
            }

            const { rows: inserted } = await pool.query(
                'INSERT INTO categoria ("Nombre") VALUES ($1) RETURNING *',
                [nombre]
            );

            return inserted[0];
        } catch (error) {
            throw new Error("Error al crear la Categoria");
        }
    }

    static async delete({ id }) {
        try {
            const { rows: result } = await pool.query(
                'SELECT * FROM activo WHERE "idCategoria" = $1',
                [id]
            );

            if (result.length > 0) {
                return false;
            }

            await pool.query(
                'DELETE FROM categoria WHERE "idCategoria" = $1',
                [id]
            );
        } catch (error) {
            throw new Error("Error al eliminar la Categoria");
        }
        return true;
    }

    static async update({ id, input }) {
        const { nombre } = input;

        try {
            const { rows: duplicate } = await pool.query(
                'SELECT "Nombre" FROM categoria WHERE "Nombre" = $1',
                [nombre]
            );
            if (duplicate.length > 0) {
                return false;
            }

            const { rowCount } = await pool.query(
                `UPDATE categoria
                 SET "Nombre" = COALESCE($1, "Nombre")
                 WHERE "idCategoria" = $2;`,
                [nombre, id]
            );
            if (rowCount === 0) {
                throw new Error('No se encontro la categoria con ese id');
            }

            const { rows: updatedCategory } = await pool.query(
                `SELECT *
                 FROM categoria WHERE "idCategoria" = $1;`,
                [id]
            );

            return updatedCategory[0];
        } catch (error) {
            throw new Error("Error al actualizar la Categoria");
        }
    }

}