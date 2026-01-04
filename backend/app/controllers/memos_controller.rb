class MemosController < ApplicationController
  def index
    memos = Memo.all
    render json: memos
  end

  def create
    memo = Memo.new(memo_params)

    if memo.save
      render json: memo, status: :created
    else
      render json: { errors: memo.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def memo_params
    params.require(:memo).permit(:title, :content)
  end
end
