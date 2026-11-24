// backend/migrations/202311180001_create_tables.js
exports.up = function(knex) {
  return knex.schema
    // categories
    .createTable('announcement_categories', (table) => {
      table.increments('id').primary();
      table.json('name').notNullable(); // {ta: '...', en: '...', si: '...'}
      table.string('slug').unique().notNullable();
      table.timestamps(true, true);
    })
    // announcements main table
    .createTable('announcements', (table) => {
      table.increments('id').primary();
      table.integer('category_id').unsigned().references('id').inTable('announcement_categories').onDelete('SET NULL');
      table.string('cover_image');
      table.string('image_alt');
      table.enum('status', ['draft', 'scheduled', 'published', 'archived']).defaultTo('draft');
      table.boolean('is_featured').defaultTo(false);
      table.boolean('is_important').defaultTo(false);
      table.boolean('show_on_homepage').defaultTo(false);
      table.boolean('allow_social_sharing').defaultTo(true);
      table.timestamp('published_at').nullable();
      table.timestamp('expires_at').nullable();
      table.integer('created_by').unsigned().nullable();
      table.timestamps(true, true);
    })
    // translations
    .createTable('announcement_translations', (table) => {
      table.increments('id').primary();
      table.integer('announcement_id').unsigned().references('id').inTable('announcements').onDelete('CASCADE');
      table.string('language_code', 2).notNullable();
      table.string('title').notNullable();
      table.text('short_description').notNullable();
      table.text('content').notNullable();
      table.string('image_caption').nullable();
      table.timestamps(true, true);
    })
    // attachments
    .createTable('announcement_attachments', (table) => {
      table.increments('id').primary();
      table.integer('announcement_id').unsigned().references('id').inTable('announcements').onDelete('CASCADE');
      table.string('file_path').notNullable();
      table.string('file_type').notNullable();
      table.string('file_name').notNullable();
      table.timestamps(true, true);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('announcement_attachments')
    .dropTableIfExists('announcement_translations')
    .dropTableIfExists('announcements')
    .dropTableIfExists('announcement_categories');
};
