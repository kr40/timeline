-- Remove "Mix of both" votes and rename Mum/Dad -> Aditi/Kartik for trait polls.

delete from trait_votes where choice = 'mix';

alter table trait_votes drop constraint trait_votes_choice_check;

update trait_votes set choice = 'aditi' where choice = 'mum';
update trait_votes set choice = 'kartik' where choice = 'dad';

alter table trait_votes add constraint trait_votes_choice_check check (choice in ('aditi', 'kartik'));
